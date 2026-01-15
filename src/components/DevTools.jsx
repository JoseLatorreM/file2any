import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import * as XLSX from 'xlsx';
import { HexColorPicker, RgbaColorPicker } from 'react-colorful';
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
  Sparkles,
  Search,
  Flag,
  Palette,
  Pipette
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

  // RegEx Tester states
  const [regexPattern, setRegexPattern] = useState('');
  const [regexFlags, setRegexFlags] = useState({ g: true, i: false, m: false, s: false, u: false });
  const [testText, setTestText] = useState('');
  const [regexError, setRegexError] = useState(null);

  // Color Picker states
  const [color, setColor] = useState('#6366f1');
  const [colorFormat, setColorFormat] = useState('hex'); // 'hex' or 'rgba'
  const [copiedFormat, setCopiedFormat] = useState(null);

  // RegEx Tester functions
  const getFlagsString = () => {
    return Object.entries(regexFlags)
      .filter(([_, value]) => value)
      .map(([flag, _]) => flag)
      .join('');
  };

  const regexResults = useMemo(() => {
    if (!regexPattern || !testText) {
      setRegexError(null);
      return { matches: [], groups: [], count: 0 };
    }

    try {
      const flags = getFlagsString();
      const regex = new RegExp(regexPattern, flags);
      const matches = [];
      const groups = [];
      let match;

      if (regexFlags.g) {
        // Global flag - find all matches
        const globalRegex = new RegExp(regexPattern, flags);
        while ((match = globalRegex.exec(testText)) !== null) {
          matches.push({
            text: match[0],
            index: match.index,
            length: match[0].length,
            groups: match.slice(1)
          });
          // Prevent infinite loop on zero-length matches
          if (match.index === globalRegex.lastIndex) {
            globalRegex.lastIndex++;
          }
        }
      } else {
        // Non-global - find first match
        match = regex.exec(testText);
        if (match) {
          matches.push({
            text: match[0],
            index: match.index,
            length: match[0].length,
            groups: match.slice(1)
          });
        }
      }

      // Extract group information
      if (matches.length > 0 && matches[0].groups.length > 0) {
        matches[0].groups.forEach((group, index) => {
          groups.push({
            index: index + 1,
            value: group
          });
        });
      }

      setRegexError(null);
      return { matches, groups, count: matches.length };
    } catch (error) {
      setRegexError(error.message);
      return { matches: [], groups: [], count: 0 };
    }
  }, [regexPattern, testText, regexFlags]);

  const highlightMatches = () => {
    if (!testText || regexResults.matches.length === 0) {
      return testText;
    }

    const parts = [];
    let lastIndex = 0;

    regexResults.matches.forEach((match, i) => {
      // Add text before match
      if (match.index > lastIndex) {
        parts.push({
          text: testText.slice(lastIndex, match.index),
          isMatch: false
        });
      }

      // Add match
      parts.push({
        text: match.text,
        isMatch: true,
        matchIndex: i
      });

      lastIndex = match.index + match.length;
    });

    // Add remaining text
    if (lastIndex < testText.length) {
      parts.push({
        text: testText.slice(lastIndex),
        isMatch: false
      });
    }

    return parts;
  };

  const commonPatterns = [
    { name: 'Email', pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$', description: 'Valida direcciones de email' },
    { name: 'URL', pattern: 'https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)', description: 'URLs HTTP/HTTPS' },
    { name: 'Teléfono', pattern: '^\\+?[\\d\\s\\-()]{7,}$', description: 'Números de teléfono' },
    { name: 'Fecha (YYYY-MM-DD)', pattern: '\\d{4}-\\d{2}-\\d{2}', description: 'Formato ISO' },
    { name: 'Hora (HH:MM)', pattern: '([01]?[0-9]|2[0-3]):[0-5][0-9]', description: 'Formato 24h' },
    { name: 'Código Hex', pattern: '#[0-9A-Fa-f]{6}', description: 'Colores hexadecimales' },
    { name: 'IPv4', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', description: 'Direcciones IP' },
    { name: 'Números', pattern: '-?\\d+(\\.\\d+)?', description: 'Enteros y decimales' }
  ];

  // Color Picker functions
  const hexToRgba = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
      a: 1
    } : { r: 99, g: 102, b: 241, a: 1 };
  };

  const rgbaToHex = (rgba) => {
    return '#' + [rgba.r, rgba.g, rgba.b].map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  const rgbToHsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  };

  const rgbToHsv = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;

    if (max === min) {
      h = 0;
    } else {
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      v: Math.round(v * 100)
    };
  };

  const getCurrentRgba = () => {
    if (typeof color === 'string') {
      return hexToRgba(color);
    }
    return color;
  };

  const copyColorFormat = async (format, value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2000);
      toast({
        title: t('devTools.copied', 'Copiado'),
        description: `${format} copiado al portapapeles`,
      });
    } catch (err) {
      toast({
        title: t('devTools.error', 'Error'),
        description: t('devTools.copyFailed', 'No se pudo copiar'),
        variant: 'destructive'
      });
    }
  };

  const parseColorInput = (input) => {
    const trimmed = input.trim();
    
    // HEX
    if (/^#?[0-9A-Fa-f]{6}$/.test(trimmed)) {
      const hex = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
      setColor(hex);
      return true;
    }
    
    // RGB/RGBA
    const rgbMatch = trimmed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (rgbMatch) {
      const rgba = {
        r: parseInt(rgbMatch[1]),
        g: parseInt(rgbMatch[2]),
        b: parseInt(rgbMatch[3]),
        a: rgbMatch[4] ? parseFloat(rgbMatch[4]) : 1
      };
      setColor(rgba);
      return true;
    }
    
    return false;
  };

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
          CSV → SQL
        </Button>
        <Button
          variant={selectedTool === 'color-picker' ? 'default' : 'outline'}
          onClick={() => setSelectedTool('color-picker')}
          className="gap-2"
        >
          <Palette className="w-4 h-4" />
          {t('devTools.colorPicker', 'Color Picker')}
        </Button>
        <Button
          variant={selectedTool === 'regex-tester' ? 'default' : 'outline'}
          onClick={() => setSelectedTool('regex-tester')}
          className="gap-2"
        >
          <Search className="w-4 h-4" />
          {t('devTools.regexTester', 'RegEx Tester')}
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

      {/* RegEx Tester Tool */}
      {selectedTool === 'regex-tester' && (
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column - Pattern & Text Input */}
            <div className="space-y-4">
              {/* Pattern Input */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-xl border p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-5 h-5 text-violet-500" />
                  <h3 className="text-lg font-semibold">{t('devTools.regexPattern', 'Expresión Regular')}</h3>
                </div>

                {/* Pattern Input */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl text-muted-foreground">/</span>
                    <input
                      type="text"
                      value={regexPattern}
                      onChange={(e) => setRegexPattern(e.target.value)}
                      placeholder="tu[\\s-]?patrón[\\s-]?aquí"
                      className="flex-1 px-3 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-violet-500 outline-none font-mono text-sm"
                    />
                    <span className="text-2xl text-muted-foreground">/{getFlagsString()}</span>
                  </div>
                  
                  {/* Flags */}
                  <div className="flex items-center gap-2 mb-3">
                    <Flag className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground mr-2">Flags:</span>
                    {Object.entries({ g: 'Global', i: 'Ignorar mayúsculas', m: 'Multiline', s: 'Dot all', u: 'Unicode' }).map(([flag, label]) => (
                      <label key={flag} className="flex items-center gap-1 cursor-pointer text-xs">
                        <input
                          type="checkbox"
                          checked={regexFlags[flag]}
                          onChange={(e) => setRegexFlags({ ...regexFlags, [flag]: e.target.checked })}
                          className="rounded border-gray-300 text-violet-500 focus:ring-violet-500"
                        />
                        <span className="font-mono font-bold">{flag}</span>
                        <span className="text-muted-foreground">({label})</span>
                      </label>
                    ))}
                  </div>

                  {/* Error Display */}
                  {regexError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-3 py-2 rounded-lg text-sm">
                      <AlertCircle className="w-4 h-4 inline mr-2" />
                      <strong>Error:</strong> {regexError}
                    </div>
                  )}
                </div>

                {/* Common Patterns */}
                <div className="mb-4">
                  <div className="text-sm font-medium mb-2">Patrones Comunes:</div>
                  <div className="flex flex-wrap gap-1">
                    {commonPatterns.map((pattern) => (
                      <button
                        key={pattern.name}
                        onClick={() => {
                          setRegexPattern(pattern.pattern);
                          setRegexFlags({ g: true, i: false, m: false, s: false, u: false });
                        }}
                        className="px-2 py-1 text-xs rounded bg-muted hover:bg-muted-foreground/10 transition-colors"
                        title={pattern.description}
                      >
                        {pattern.name}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Test Text Input */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-xl border p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-violet-500" />
                    <h3 className="text-lg font-semibold">{t('devTools.testText', 'Texto de Prueba')}</h3>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {regexResults.count} {regexResults.count === 1 ? 'coincidencia' : 'coincidencias'}
                  </div>
                </div>
                <textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="Escribe o pega el texto donde quieres buscar coincidencias..."
                  className="w-full min-h-[300px] px-3 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-violet-500 outline-none resize-y font-mono text-sm"
                />
              </motion.div>
            </div>

            {/* Right Column - Results */}
            <div className="space-y-4">
              {/* Highlighted Results */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 }}
                className="bg-card rounded-xl border overflow-hidden"
              >
                <div className="bg-muted/50 px-4 py-3 border-b flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-violet-500" />
                    <h3 className="text-lg font-semibold">Resultados Resaltados</h3>
                  </div>
                  <div className="text-sm font-medium text-violet-600 dark:text-violet-400">
                    {regexResults.count} match{regexResults.count !== 1 ? 'es' : ''}
                  </div>
                </div>
                <div className="p-4 min-h-[300px] max-h-[400px] overflow-auto">
                  {testText && regexPattern ? (
                    <div className="font-mono text-sm whitespace-pre-wrap break-words">
                      {highlightMatches().map((part, index) => (
                        part.isMatch ? (
                          <mark
                            key={index}
                            className="bg-yellow-300 dark:bg-yellow-600 text-foreground px-1 rounded"
                          >
                            {part.text}
                          </mark>
                        ) : (
                          <span key={index}>{part.text}</span>
                        )
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-muted-foreground py-16">
                      <AlertCircle className="w-12 h-12 mb-4 opacity-50" />
                      <p className="text-center">
                        Ingresa un patrón regex y texto para ver los resultados
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Match Details */}
              {regexResults.matches.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card rounded-xl border overflow-hidden"
                >
                  <div className="bg-muted/50 px-4 py-3 border-b flex items-center justify-between">
                    <h4 className="font-semibold">Detalles de Coincidencias</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          const matchesText = regexResults.matches.map((m, i) => 
                            `Match ${i + 1}: "${m.text}" (posición: ${m.index})`
                          ).join('\n');
                          await navigator.clipboard.writeText(matchesText);
                          toast({
                            title: t('devTools.copied', 'Copiado'),
                            description: 'Coincidencias copiadas al portapapeles',
                          });
                        } catch (err) {
                          toast({
                            title: t('devTools.error', 'Error'),
                            description: t('devTools.copyFailed', 'No se pudo copiar'),
                            variant: 'destructive'
                          });
                        }
                      }}
                      className="h-7 px-2"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="p-4 max-h-[250px] overflow-y-auto space-y-2">
                    {regexResults.matches.map((match, index) => (
                      <div key={index} className="bg-muted/30 rounded-lg p-3 text-sm">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-violet-600 dark:text-violet-400">
                            Match #{index + 1}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Posición: {match.index}
                          </span>
                        </div>
                        <code className="block bg-background px-2 py-1 rounded font-mono text-xs break-all">
                          {match.text}
                        </code>
                        {match.groups.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-border">
                            <div className="text-xs text-muted-foreground mb-1">Grupos capturados:</div>
                            {match.groups.map((group, gIndex) => (
                              <div key={gIndex} className="text-xs ml-2">
                                <span className="text-muted-foreground">Grupo {gIndex + 1}:</span>{' '}
                                <code className="bg-background px-1 rounded">{group || '(vacío)'}</code>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Quick Guide */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card rounded-xl border p-4"
              >
                <h4 className="font-semibold mb-2 text-sm">💡 Guía Rápida de RegEx</h4>
                <div className="space-y-1 text-xs">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div><code className="bg-muted px-1 rounded">.</code> - Cualquier carácter</div>
                    <div><code className="bg-muted px-1 rounded">\d</code> - Dígito (0-9)</div>
                    <div><code className="bg-muted px-1 rounded">\w</code> - Palabra (a-zA-Z0-9_)</div>
                    <div><code className="bg-muted px-1 rounded">\s</code> - Espacio en blanco</div>
                    <div><code className="bg-muted px-1 rounded">*</code> - 0 o más veces</div>
                    <div><code className="bg-muted px-1 rounded">+</code> - 1 o más veces</div>
                    <div><code className="bg-muted px-1 rounded">?</code> - 0 o 1 vez</div>
                    <div><code className="bg-muted px-1 rounded">{'{'} n {'}'}</code> - Exactamente n veces</div>
                    <div><code className="bg-muted px-1 rounded">[abc]</code> - a, b, o c</div>
                    <div><code className="bg-muted px-1 rounded">[^abc]</code> - No a, b, ni c</div>
                    <div><code className="bg-muted px-1 rounded">^</code> - Inicio de línea</div>
                    <div><code className="bg-muted px-1 rounded">$</code> - Fin de línea</div>
                    <div><code className="bg-muted px-1 rounded">()</code> - Grupo de captura</div>
                    <div><code className="bg-muted px-1 rounded">|</code> - OR (uno u otro)</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* Color Picker & Converter Tool */}
      {selectedTool === 'color-picker' && (
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid lg:grid-cols-2 gap-6"
          >
            {/* Left - Color Picker */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-xl border p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Pipette className="w-5 h-5 text-violet-500" />
                  <h3 className="text-lg font-semibold">{t('devTools.pickColor', 'Selecciona un Color')}</h3>
                </div>

                {/* Color Format Toggle */}
                <div className="flex gap-2 mb-4">
                  <Button
                    variant={colorFormat === 'hex' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setColorFormat('hex')}
                    className="flex-1"
                  >
                    HEX
                  </Button>
                  <Button
                    variant={colorFormat === 'rgba' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setColorFormat('rgba')}
                    className="flex-1"
                  >
                    RGBA
                  </Button>
                </div>

                {/* Color Pickers */}
                <div className="space-y-4">
                  {colorFormat === 'hex' ? (
                    <div className="space-y-3">
                      <HexColorPicker 
                        color={typeof color === 'string' ? color : rgbaToHex(color)} 
                        onChange={(newColor) => setColor(newColor)}
                        style={{ width: '100%', height: '200px' }}
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={typeof color === 'string' ? color : rgbaToHex(color)}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^#[0-9A-Fa-f]{0,6}$/.test(val) || val === '') {
                              setColor(val || '#000000');
                            }
                          }}
                          className="flex-1 px-3 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-violet-500 outline-none font-mono"
                          placeholder="#6366f1"
                        />
                        <div 
                          className="w-12 h-10 rounded-lg border-2 border-muted-foreground/20 shadow-inner"
                          style={{ backgroundColor: typeof color === 'string' ? color : rgbaToHex(color) }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <RgbaColorPicker 
                        color={typeof color === 'string' ? hexToRgba(color) : color} 
                        onChange={(newColor) => setColor(newColor)}
                        style={{ width: '100%', height: '200px' }}
                      />
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">R</label>
                          <input
                            type="number"
                            min="0"
                            max="255"
                            value={getCurrentRgba().r}
                            onChange={(e) => {
                              const rgba = getCurrentRgba();
                              setColor({ ...rgba, r: Math.min(255, Math.max(0, parseInt(e.target.value) || 0)) });
                            }}
                            className="w-full px-2 py-1.5 rounded border bg-background text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">G</label>
                          <input
                            type="number"
                            min="0"
                            max="255"
                            value={getCurrentRgba().g}
                            onChange={(e) => {
                              const rgba = getCurrentRgba();
                              setColor({ ...rgba, g: Math.min(255, Math.max(0, parseInt(e.target.value) || 0)) });
                            }}
                            className="w-full px-2 py-1.5 rounded border bg-background text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">B</label>
                          <input
                            type="number"
                            min="0"
                            max="255"
                            value={getCurrentRgba().b}
                            onChange={(e) => {
                              const rgba = getCurrentRgba();
                              setColor({ ...rgba, b: Math.min(255, Math.max(0, parseInt(e.target.value) || 0)) });
                            }}
                            className="w-full px-2 py-1.5 rounded border bg-background text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground block mb-1">A</label>
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.1"
                            value={getCurrentRgba().a}
                            onChange={(e) => {
                              const rgba = getCurrentRgba();
                              setColor({ ...rgba, a: Math.min(1, Math.max(0, parseFloat(e.target.value) || 0)) });
                            }}
                            className="w-full px-2 py-1.5 rounded border bg-background text-sm focus:ring-2 focus:ring-violet-500 outline-none"
                          />
                        </div>
                      </div>
                      <div 
                        className="w-full h-12 rounded-lg border-2 border-muted-foreground/20 shadow-inner"
                        style={{ 
                          backgroundColor: typeof color === 'string' 
                            ? color 
                            : `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Quick Color Input */}
                <div className="mt-4">
                  <label className="text-sm text-muted-foreground block mb-2">
                    {t('devTools.pasteColor', 'O pega un color:')}
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: #6366f1 o rgb(99, 102, 241)"
                    onPaste={(e) => {
                      setTimeout(() => {
                        const input = e.target.value;
                        parseColorInput(input);
                      }, 0);
                    }}
                    className="w-full px-3 py-2 rounded-lg border bg-background focus:ring-2 focus:ring-violet-500 outline-none text-sm"
                  />
                </div>
              </motion.div>
            </div>

            {/* Right - Color Formats */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-card rounded-xl border overflow-hidden"
              >
                <div className="bg-muted/50 px-4 py-3 border-b flex items-center gap-2">
                  <Palette className="w-5 h-5 text-violet-500" />
                  <h3 className="text-lg font-semibold">{t('devTools.colorFormats', 'Formatos de Color')}</h3>
                </div>

                <div className="p-4 space-y-3">
                  {(() => {
                    const rgba = getCurrentRgba();
                    const hexValue = typeof color === 'string' ? color : rgbaToHex(color);
                    const hsl = rgbToHsl(rgba.r, rgba.g, rgba.b);
                    const hsv = rgbToHsv(rgba.r, rgba.g, rgba.b);

                    return (
                      <>
                        {/* HEX */}
                        <div className="bg-muted/30 rounded-lg p-3 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">HEX</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyColorFormat('HEX', hexValue.toUpperCase())}
                              className="h-7 px-2"
                            >
                              {copiedFormat === 'HEX' ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <code className="text-sm font-mono bg-background px-3 py-2 rounded block">
                            {hexValue.toUpperCase()}
                          </code>
                        </div>

                        {/* RGB */}
                        <div className="bg-muted/30 rounded-lg p-3 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">RGB</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyColorFormat('RGB', `rgb(${rgba.r}, ${rgba.g}, ${rgba.b})`)}
                              className="h-7 px-2"
                            >
                              {copiedFormat === 'RGB' ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <code className="text-sm font-mono bg-background px-3 py-2 rounded block">
                            rgb({rgba.r}, {rgba.g}, {rgba.b})
                          </code>
                        </div>

                        {/* RGBA */}
                        <div className="bg-muted/30 rounded-lg p-3 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">RGBA</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyColorFormat('RGBA', `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`)}
                              className="h-7 px-2"
                            >
                              {copiedFormat === 'RGBA' ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <code className="text-sm font-mono bg-background px-3 py-2 rounded block">
                            rgba({rgba.r}, {rgba.g}, {rgba.b}, {rgba.a})
                          </code>
                        </div>

                        {/* HSL */}
                        <div className="bg-muted/30 rounded-lg p-3 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">HSL</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyColorFormat('HSL', `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`)}
                              className="h-7 px-2"
                            >
                              {copiedFormat === 'HSL' ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <code className="text-sm font-mono bg-background px-3 py-2 rounded block">
                            hsl({hsl.h}, {hsl.s}%, {hsl.l}%)
                          </code>
                        </div>

                        {/* HSV */}
                        <div className="bg-muted/30 rounded-lg p-3 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">HSV</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyColorFormat('HSV', `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`)}
                              className="h-7 px-2"
                            >
                              {copiedFormat === 'HSV' ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <code className="text-sm font-mono bg-background px-3 py-2 rounded block">
                            hsv({hsv.h}, {hsv.s}%, {hsv.v}%)
                          </code>
                        </div>

                        {/* CSS Variable */}
                        <div className="bg-muted/30 rounded-lg p-3 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">CSS Variable</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyColorFormat('CSS', `--color-primary: ${hexValue};`)}
                              className="h-7 px-2"
                            >
                              {copiedFormat === 'CSS' ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <code className="text-sm font-mono bg-background px-3 py-2 rounded block">
                            --color-primary: {hexValue};
                          </code>
                        </div>

                        {/* Tailwind */}
                        <div className="bg-muted/30 rounded-lg p-3 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Tailwind</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyColorFormat('Tailwind', `bg-[${hexValue}]`)}
                              className="h-7 px-2"
                            >
                              {copiedFormat === 'Tailwind' ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <code className="text-sm font-mono bg-background px-3 py-2 rounded block">
                            bg-[{hexValue}]
                          </code>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </motion.div>

              {/* Color Preview Card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-xl border overflow-hidden"
              >
                <div 
                  className="h-32 relative"
                  style={{ backgroundColor: typeof color === 'string' ? color : rgbaToHex(color) }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div 
                        className="text-2xl font-bold drop-shadow-lg"
                        style={{ 
                          color: (() => {
                            const rgba = getCurrentRgba();
                            return rgbToHsl(rgba.r, rgba.g, rgba.b).l > 50 ? '#000' : '#fff';
                          })()
                        }}
                      >
                        {(typeof color === 'string' ? color : rgbaToHex(color)).toUpperCase()}
                      </div>
                      <div 
                        className="text-sm drop-shadow"
                        style={{ 
                          color: (() => {
                            const rgba = getCurrentRgba();
                            return rgbToHsl(rgba.r, rgba.g, rgba.b).l > 50 ? '#000' : '#fff';
                          })(),
                          opacity: 0.8
                        }}
                      >
                        RGB: {getCurrentRgba().r}, {getCurrentRgba().g}, {getCurrentRgba().b}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DevTools;
