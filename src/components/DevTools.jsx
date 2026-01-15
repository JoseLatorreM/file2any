import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { 
  Database, 
  Upload, 
  Copy, 
  Download, 
  FileSpreadsheet, 
  Code2, 
  Settings2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Table,
  FileCode,
  Sparkles
} from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';

const DevTools = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState(null);
  const [sqlOutput, setSqlOutput] = useState('');
  const [tableName, setTableName] = useState('my_table');
  const [selectedTool, setSelectedTool] = useState('csv-to-sql');
  const [options, setOptions] = useState({
    includeHeader: true,
    addTransaction: false,
    nullForEmpty: true,
    batchSize: 100,
    dialect: 'mysql' // mysql, postgresql, sqlite
  });
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pastedData, setPastedData] = useState('');
  const [inputMode, setInputMode] = useState('paste'); // 'paste' or 'file'
  const [editableData, setEditableData] = useState(null); // For editable preview table
  const [editingCell, setEditingCell] = useState(null); // {row, col}

  // Parse tabular data (from Excel paste) or CSV
  const parseTabularData = (content) => {
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return null;

    // Check if it's tab-separated (Excel paste) or comma/semicolon separated (CSV)
    const firstLine = lines[0];
    const hasTab = firstLine.includes('\t');
    
    if (hasTab) {
      // Excel paste format - simple tab-separated
      return lines.map(line => line.split('\t').map(cell => cell.trim()));
    } else {
      // CSV format - use CSV parser
      return parseCSV(content);
    }
  };

  // Parse CSV content
  const parseCSV = (content) => {
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return null;

    const result = [];
    let currentLine = '';
    let insideQuotes = false;

    for (const line of lines) {
      currentLine += (currentLine ? '\n' : '') + line;
      
      // Count quotes to determine if we're inside a quoted field
      const quoteCount = (currentLine.match(/"/g) || []).length;
      insideQuotes = quoteCount % 2 !== 0;
      
      if (!insideQuotes) {
        const row = parseCSVLine(currentLine);
        if (row.length > 0) {
          result.push(row);
        }
        currentLine = '';
      }
    }

    if (currentLine && !insideQuotes) {
      const row = parseCSVLine(currentLine);
      if (row.length > 0) {
        result.push(row);
      }
    }

    return result;
  };

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let insideQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if ((char === ',' || char === ';') && !insideQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  // Escape SQL values based on dialect
  const escapeValue = (value, dialect) => {
    // Handle null, undefined, or empty values
    if (value === null || value === undefined || value === '') {
      return options.nullForEmpty ? 'NULL' : "''";
    }
    
    // Convert to string
    const strValue = String(value);
    
    // Check if it's a number
    if (!isNaN(strValue) && strValue.trim() !== '') {
      return strValue;
    }
    
    // Escape string
    let escaped = strValue.replace(/'/g, "''");
    
    if (dialect === 'mysql') {
      escaped = escaped.replace(/\\/g, '\\\\');
    }
    
    return `'${escaped}'`;
  };

  // Generate SQL INSERT statements
  const generateSQL = (data, columns) => {
    console.log('generateSQL called with:', { data, columns, options });
    
    if (!data || data.length === 0) {
      console.log('No data provided');
      return '';
    }
    
    if (!columns || columns.length === 0) {
      console.log('No columns provided');
      return '';
    }
    
    const { dialect, addTransaction, batchSize } = options;
    let sql = '';
    
    // Add CREATE TABLE statement
    sql += generateCreateTable(columns) + '\n\n';
    
    // Add transaction start
    if (addTransaction) {
      if (dialect === 'mysql') {
        sql += 'START TRANSACTION;\n\n';
      } else {
        sql += 'BEGIN TRANSACTION;\n\n';
      }
    }

    // Generate column list
    const columnList = columns.map(col => {
      const cleanCol = String(col || 'column').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      if (dialect === 'mysql') {
        return `\`${cleanCol}\``;
      } else if (dialect === 'postgresql') {
        return `"${cleanCol}"`;
      }
      return cleanCol;
    }).join(', ');

    // Generate INSERT statements
    const rows = data.slice(options.includeHeader ? 1 : 0);
    
    console.log('Rows to process:', rows.length);
    
    if (dialect === 'mysql' && batchSize > 1) {
      // Batch inserts for MySQL
      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);
        sql += `INSERT INTO \`${tableName}\` (${columnList}) VALUES\n`;
        
        const values = batch.map(row => {
          const vals = row.map(val => escapeValue(val, dialect)).join(', ');
          return `  (${vals})`;
        }).join(',\n');
        
        sql += values + ';\n\n';
      }
    } else {
      // Individual inserts
      for (const row of rows) {
        const values = row.map(val => escapeValue(val, dialect)).join(', ');
        
        if (dialect === 'mysql') {
          sql += `INSERT INTO \`${tableName}\` (${columnList}) VALUES (${values});\n`;
        } else if (dialect === 'postgresql') {
          sql += `INSERT INTO "${tableName}" (${columnList}) VALUES (${values});\n`;
        } else {
          sql += `INSERT INTO ${tableName} (${columnList}) VALUES (${values});\n`;
        }
      }
    }

    // Add transaction end
    if (addTransaction) {
      sql += '\nCOMMIT;\n';
    }

    console.log('Generated SQL length:', sql.length);
    return sql;
  };

  // Generate CREATE TABLE statement
  const generateCreateTable = (columns) => {
    if (!columns || columns.length === 0) return '';
    
    const { dialect } = options;
    let sql = '';
    
    const columnDefs = columns.map(col => {
      const cleanCol = String(col || 'column').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      
      if (dialect === 'mysql') {
        return `  \`${cleanCol}\` VARCHAR(255)`;
      } else if (dialect === 'postgresql') {
        return `  "${cleanCol}" VARCHAR(255)`;
      }
      return `  ${cleanCol} VARCHAR(255)`;
    }).join(',\n');
    
    if (dialect === 'mysql') {
      sql = `CREATE TABLE \`${tableName}\` (\n${columnDefs}\n);`;
    } else if (dialect === 'postgresql') {
      sql = `CREATE TABLE "${tableName}" (\n${columnDefs}\n);`;
    } else {
      sql = `CREATE TABLE ${tableName} (\n${columnDefs}\n);`;
    }
    
    return sql;
  };

  // Handle file upload
  const handleFileUpload = useCallback((uploadedFile) => {
    if (!uploadedFile) return;

    const fileName = uploadedFile.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isCSV = fileName.endsWith('.csv');
    const isXML = fileName.endsWith('.xml') || fileName.endsWith('.xhtml');

    if (isExcel) {
      // Parse Excel file
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to array of arrays
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          
          if (jsonData && jsonData.length > 0) {
            // Filter out empty rows
            const parsed = jsonData.filter(row => row.some(cell => cell !== '' && cell !== null && cell !== undefined));
            
            if (parsed.length > 0) {
              setCsvData(parsed);
              setEditableData(parsed);
              setFile(uploadedFile);
              setInputMode('file');
              
              setPreview({
                headers: parsed[0],
                rows: parsed.slice(1),
                totalRows: parsed.length - 1
              });
              
              const sql = generateSQL(parsed, parsed[0]);
              setSqlOutput(sql);
              
              toast({
                title: t('devTools.fileLoaded', 'Archivo cargado'),
                description: t('devTools.rowsLoaded', { count: parsed.length - 1, defaultValue: `${parsed.length - 1} filas cargadas` }),
              });
            } else {
              throw new Error('No data found in Excel file');
            }
          } else {
            throw new Error('Empty Excel file');
          }
        } catch (error) {
          console.error('Error parsing Excel:', error);
          toast({
            title: t('devTools.error', 'Error'),
            description: t('devTools.invalidExcel', 'No se pudo parsear el archivo Excel'),
            variant: 'destructive'
          });
        }
      };
      reader.readAsArrayBuffer(uploadedFile);
    } else if (isCSV || isXML) {
      // Parse CSV/XML as text
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        const parsed = parseTabularData(content);
        
        if (parsed && parsed.length > 0) {
          setCsvData(parsed);
          setEditableData(parsed);
          setFile(uploadedFile);
          setInputMode('file');
          
          setPreview({
            headers: parsed[0],
            rows: parsed.slice(1),
            totalRows: parsed.length - 1
          });
          
          const sql = generateSQL(parsed, parsed[0]);
          setSqlOutput(sql);
          
          toast({
            title: t('devTools.fileLoaded', 'Archivo cargado'),
            description: t('devTools.rowsLoaded', { count: parsed.length - 1, defaultValue: `${parsed.length - 1} filas cargadas` }),
          });
        } else {
          toast({
            title: t('devTools.error', 'Error'),
            description: t('devTools.invalidCSV', 'No se pudo parsear el archivo'),
            variant: 'destructive'
          });
        }
      };
      reader.readAsText(uploadedFile);
    } else {
      toast({
        title: t('devTools.error', 'Error'),
        description: t('devTools.unsupportedFormat', 'Formato no soportado. Use: .xlsx, .xls, .csv, .xml, .xhtml'),
        variant: 'destructive'
      });
    }
  }, [options, tableName, toast, t, parseTabularData]);

  // Handle paste from Excel
  const handlePaste = useCallback((content) => {
    if (!content || content.trim() === '') return;

    const parsed = parseTabularData(content);
    
    if (parsed && parsed.length > 0) {
      setCsvData(parsed);
      setEditableData(parsed);
      setFile(null);
      setInputMode('paste');
      
      // Set preview (all rows)
      setPreview({
        headers: parsed[0],
        rows: parsed.slice(1),
        totalRows: parsed.length - 1
      });
      
      // Auto-generate SQL
      const sql = generateSQL(parsed, parsed[0]);
      setSqlOutput(sql);
      
      toast({
        title: t('devTools.dataLoaded', 'Datos cargados'),
        description: t('devTools.rowsLoaded', { count: parsed.length - 1, defaultValue: `${parsed.length - 1} filas cargadas` }),
      });
    } else {
      toast({
        title: t('devTools.error', 'Error'),
        description: t('devTools.invalidData', 'No se pudo parsear los datos'),
        variant: 'destructive'
      });
    }
  }, [options, tableName, toast, t, parseTabularData]);

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const fileName = droppedFile.name.toLowerCase();
      const validExtensions = ['.csv', '.xlsx', '.xls', '.xml', '.xhtml'];
      const isValid = validExtensions.some(ext => fileName.endsWith(ext));
      
      if (isValid) {
        handleFileUpload(droppedFile);
      } else {
        toast({
          title: t('devTools.error', 'Error'),
          description: t('devTools.unsupportedFormat', 'Formato no soportado. Use: .xlsx, .xls, .csv, .xml, .xhtml'),
          variant: 'destructive'
        });
      }
    }
  };

  // Re-generate SQL when options change
  const regenerateSQL = () => {
    if (csvData) {
      const sql = generateSQL(csvData, csvData[0]);
      setSqlOutput(sql);
      
      toast({
        title: t('devTools.regenerated', 'SQL regenerado'),
        description: t('devTools.optionsApplied', 'Las opciones han sido aplicadas'),
      });
    }
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlOutput);
      toast({
        title: t('devTools.copied', 'Copiado'),
        description: t('devTools.copiedToClipboard', 'SQL copiado al portapapeles'),
      });
    } catch (err) {
      toast({
        title: t('devTools.error', 'Error'),
        description: t('devTools.copyFailed', 'No se pudo copiar'),
        variant: 'destructive'
      });
    }
  };

  // Download SQL file
  const downloadSQL = () => {
    const blob = new Blob([sqlOutput], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableName}_inserts.sql`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: t('devTools.downloaded', 'Descargado'),
      description: t('devTools.fileDownloaded', 'Archivo SQL descargado'),
    });
  };

  // Handle cell edit
  const handleCellEdit = (rowIndex, colIndex, value) => {
    if (!editableData) return;
    
    const newData = [...editableData];
    
    if (rowIndex === -1) {
      // Editing header
      newData[0][colIndex] = value;
    } else {
      // Editing data row
      const actualRowIndex = rowIndex + 1; // +1 because row 0 is headers
      
      if (!newData[actualRowIndex]) {
        newData[actualRowIndex] = [];
      }
      newData[actualRowIndex][colIndex] = value;
    }
    
    setEditableData(newData);
    setCsvData(newData);
    
    // Update preview (all rows)
    setPreview({
      headers: newData[0],
      rows: newData.slice(1),
      totalRows: newData.length - 1
    });
    
    // Regenerate SQL in real-time
    const sql = generateSQL(newData, newData[0]);
    setSqlOutput(sql);
  };

  // Clear all
  const clearAll = () => {
    setFile(null);
    setCsvData(null);
    setSqlOutput('');
    setPreview(null);
    setPastedData('');
    setEditableData(null);
    setEditingCell(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg">
            <Code2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            {t('devTools.title', 'DevTools')}
          </h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {t('devTools.subtitle', 'Herramientas útiles para desarrolladores • Genera SQL, formatea código y más')}
        </p>
      </motion.div>

      {/* Tool Selector */}
      <div className="flex justify-center gap-2 flex-wrap">
        <Button
          variant={selectedTool === 'csv-to-sql' ? 'default' : 'outline'}
          onClick={() => setSelectedTool('csv-to-sql')}
          className="gap-2"
        >
          <Database className="w-4 h-4" />
          CSV → SQL INSERT
        </Button>
        {/* Placeholder para futuras herramientas */}
        <Button
          variant="outline"
          disabled
          className="gap-2 opacity-50"
        >
          <FileCode className="w-4 h-4" />
          {t('devTools.comingSoon', 'Próximamente...')}
        </Button>
      </div>

      {/* CSV to SQL Tool */}
      {selectedTool === 'csv-to-sql' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Input */}
          <div className="space-y-4">
            {/* Input Mode Toggle */}
            <div className="flex justify-center gap-2">
              <Button
                variant={inputMode === 'paste' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInputMode('paste')}
                className="gap-2"
              >
                <Table className="w-4 h-4" />
                {t('devTools.pasteData', 'Pegar Datos')}
              </Button>
              <Button
                variant={inputMode === 'file' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setInputMode('file')}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                {t('devTools.uploadFile', 'Subir Archivo')}
              </Button>
            </div>

            {/* Paste Area */}
            {inputMode === 'paste' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border-2 border-dashed rounded-xl overflow-hidden"
              >
                <div className="bg-muted/50 px-4 py-2 border-b flex items-center gap-2">
                  <Table className="w-4 h-4 text-violet-500" />
                  <span className="text-sm font-medium">
                    {t('devTools.pasteFromExcel', 'Pega tus datos desde Excel/Sheets')}
                  </span>
                </div>
                <textarea
                  value={pastedData}
                  onChange={(e) => {
                    setPastedData(e.target.value);
                    if (e.target.value.trim()) {
                      handlePaste(e.target.value);
                    }
                  }}
                  placeholder={t('devTools.pastePlaceholder', 'Copia tu tabla desde Excel o Google Sheets y pégala aquí...\n\nEjemplo:\nNombre\tEdad\tCiudad\nJuan\t25\tMadrid\nMaría\t30\tBarcelona')}
                  className="w-full min-h-[200px] p-4 bg-background border-0 focus:ring-0 focus:outline-none resize-y font-mono text-sm"
                  spellCheck="false"
                />
              </motion.div>
            )}

            {/* Upload Area */}
            {inputMode === 'file' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer
                  ${isDragging 
                    ? 'border-violet-500 bg-violet-500/10' 
                    : 'border-muted-foreground/25 hover:border-violet-500/50 hover:bg-muted/50'
                  }
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('csv-upload').click()}
              >
              <input
                type="file"
                id="csv-upload"
                accept=".csv,.xlsx,.xls,.xml,.xhtml"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files[0])}
              />
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">
                {t('devTools.dropFile', 'Arrastra tu archivo aquí')}
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                {t('devTools.orClick', 'o haz clic para seleccionar')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('devTools.supportedFormats', 'Formatos: CSV, XLSX, XLS, XML, XHTML')}
              </p>
              {file && (
                <div className="mt-4 flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">{file.name}</span>
                </div>
              )}
            </motion.div>
            )}

            {/* Options */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card rounded-xl border p-4 space-y-4"
            >
              <div className="flex items-center gap-2 text-lg font-semibold">
                <Settings2 className="w-5 h-5 text-violet-500" />
                {t('devTools.options', 'Opciones')}
              </div>

              {/* Table Name */}
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {t('devTools.tableName', 'Nombre de la tabla')}
                </label>
                <input
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                  placeholder="my_table"
                />
              </div>

              {/* SQL Dialect */}
              <div>
                <label className="text-sm font-medium mb-1 block">
                  {t('devTools.dialect', 'Dialecto SQL')}
                </label>
                <select
                  value={options.dialect}
                  onChange={(e) => setOptions({ ...options, dialect: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                >
                  <option value="mysql">MySQL</option>
                  <option value="postgresql">PostgreSQL</option>
                  <option value="sqlite">SQLite</option>
                </select>
              </div>

              {/* Batch Size (MySQL only) */}
              {options.dialect === 'mysql' && (
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    {t('devTools.batchSize', 'Tamaño del lote')}
                  </label>
                  <input
                    type="number"
                    value={options.batchSize}
                    onChange={(e) => setOptions({ ...options, batchSize: parseInt(e.target.value) || 1 })}
                    min="1"
                    max="1000"
                    className="w-full px-3 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('devTools.batchHint', 'Combina múltiples INSERTs en uno (más eficiente)')}
                  </p>
                </div>
              )}

              {/* Checkboxes */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeHeader}
                    onChange={(e) => setOptions({ ...options, includeHeader: e.target.checked })}
                    className="rounded border-gray-300 text-violet-500 focus:ring-violet-500"
                  />
                  <span className="text-sm">{t('devTools.firstRowHeader', 'Primera fila es encabezado')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.addTransaction}
                    onChange={(e) => setOptions({ ...options, addTransaction: e.target.checked })}
                    className="rounded border-gray-300 text-violet-500 focus:ring-violet-500"
                  />
                  <span className="text-sm">{t('devTools.wrapTransaction', 'Envolver en transacción')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.nullForEmpty}
                    onChange={(e) => setOptions({ ...options, nullForEmpty: e.target.checked })}
                    className="rounded border-gray-300 text-violet-500 focus:ring-violet-500"
                  />
                  <span className="text-sm">{t('devTools.nullForEmpty', 'NULL para valores vacíos')}</span>
                </label>
              </div>

              {/* Regenerate Button */}
              <Button 
                onClick={regenerateSQL} 
                disabled={!csvData}
                className="w-full gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
              >
                <Sparkles className="w-4 h-4" />
                {t('devTools.regenerate', 'Regenerar SQL')}
              </Button>
            </motion.div>

            {/* Preview Table - Editable */}
            {preview && editableData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-xl border overflow-hidden"
              >
                <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Table className="w-5 h-5 text-violet-500" />
                    <span className="text-lg font-semibold">{t('devTools.preview', 'Vista previa')}</span>
                    <span className="text-sm text-muted-foreground font-normal">
                      ({preview.totalRows} {t('devTools.rows', 'filas')})
                    </span>
                  </div>
                  <span className="text-xs text-violet-600 dark:text-violet-400 font-medium">
                    ✏️ {t('devTools.editableTable', 'Haz clic para editar')}
                  </span>
                </div>
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 bg-muted/50 backdrop-blur-sm z-10">
                      <tr className="border-b">
                        <th className="px-3 py-2 text-center font-semibold text-muted-foreground w-12">#</th>
                        {preview.headers.map((header, i) => (
                          <th key={i} className="px-3 py-2 text-left font-semibold text-violet-600 dark:text-violet-400 whitespace-nowrap min-w-[120px]">
                            <input
                              type="text"
                              value={header}
                              onChange={(e) => handleCellEdit(-1, i, e.target.value)}
                              className="w-full bg-transparent border-0 focus:ring-2 focus:ring-violet-500 rounded px-2 py-1 outline-none font-semibold"
                              placeholder={`Columna ${i + 1}`}
                            />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.rows.map((row, rowIdx) => (
                        <tr key={rowIdx} className="border-b border-muted hover:bg-muted/30 transition-colors">
                          <td className="px-3 py-2 text-center text-muted-foreground font-medium">
                            {rowIdx + 1}
                          </td>
                          {row.map((cell, colIdx) => (
                            <td key={colIdx} className="px-1 py-1">
                              {editingCell?.row === rowIdx && editingCell?.col === colIdx ? (
                                <input
                                  type="text"
                                  value={cell ?? ''}
                                  onChange={(e) => handleCellEdit(rowIdx, colIdx, e.target.value)}
                                  onBlur={() => setEditingCell(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === 'Tab') {
                                      setEditingCell(null);
                                    }
                                    if (e.key === 'Escape') {
                                      setEditingCell(null);
                                    }
                                  }}
                                  autoFocus
                                  className="w-full px-2 py-1.5 bg-background border border-violet-500 rounded focus:ring-2 focus:ring-violet-500 outline-none"
                                />
                              ) : (
                                <div
                                  onClick={() => setEditingCell({ row: rowIdx, col: colIdx })}
                                  className="px-2 py-1.5 cursor-text hover:bg-violet-500/10 rounded min-h-[32px] flex items-center"
                                >
                                  {cell !== '' && cell !== null && cell !== undefined ? (
                                    <span className="truncate max-w-[200px]">{String(cell)}</span>
                                  ) : (
                                    <span className="text-muted-foreground italic text-xs">null</span>
                                  )}
                                </div>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 border-t bg-muted/20 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {preview.totalRows > 5 
                      ? `${t('devTools.showingFirst', 'Mostrando las primeras 5 filas de')} ${preview.totalRows}`
                      : `${preview.totalRows} ${t('devTools.rows', 'filas')}`
                    }
                  </span>
                  <span className="text-violet-600 dark:text-violet-400">
                    💡 {t('devTools.editHint', 'Presiona Enter o Tab para guardar')}
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Output */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="bg-card rounded-xl border overflow-hidden h-full flex flex-col"
            >
              {/* Output Header */}
              <div className="flex items-center justify-between p-4 border-b bg-muted/50">
                <div className="flex items-center gap-2 font-semibold">
                  <Database className="w-5 h-5 text-violet-500" />
                  {t('devTools.sqlPreview', 'SQL Preview')}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    disabled={!sqlOutput}
                    className="gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    {t('devTools.copy', 'Copiar')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadSQL}
                    disabled={!sqlOutput}
                    className="gap-1"
                  >
                    <Download className="w-4 h-4" />
                    {t('devTools.download', 'Descargar')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAll}
                    disabled={!file}
                    className="gap-1 text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* SQL Output */}
              <div className="flex-1 min-h-[400px] max-h-[600px] overflow-auto">
                {sqlOutput ? (
                  <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-all">
                    <code className="text-foreground">{sqlOutput}</code>
                  </pre>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
                    <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-center">
                      {t('devTools.noOutput', 'Sube un archivo CSV para generar SQL INSERT statements')}
                    </p>
                  </div>
                )}
              </div>

              {/* Stats */}
              {sqlOutput && (
                <div className="p-3 border-t bg-muted/30 text-sm text-muted-foreground flex justify-between">
                  <span>{sqlOutput.split('\n').length} {t('devTools.lines', 'líneas')}</span>
                  <span>{(new Blob([sqlOutput]).size / 1024).toFixed(2)} KB</span>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevTools;
