// xlsxConverters.js
// Centraliza toda la lógica de conversión desde XLSX a otros formatos coherentes

import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';

// XLSX → CSV (preserva datos y estructura)
export async function xlsxToCsv(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Obtener la primera hoja (o todas si hay múltiples)
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      throw new Error("No se encontraron hojas en el archivo XLSX");
    }
    
    // Convertir a CSV preservando formato
    const csvData = XLSX.utils.sheet_to_csv(worksheet, {
      header: 1,
      blankrows: false,
      strip: false
    });
    
    if (!csvData) {
      throw new Error("No se pudo extraer datos de la hoja de cálculo");
    }
    
    return new Blob([csvData], { type: 'text/csv; charset=utf-8' });
  } catch (error) {
    throw new Error("No se pudo convertir el archivo XLSX a CSV: " + error.message);
  }
}

// XLSX → JSON (preserva estructura y tipos de datos)
export async function xlsxToJson(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    const allData = [];
    
    // Procesar todas las hojas y combinar datos
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      
      // Convertir a JSON con encabezados
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null,
        blankrows: false
      });
      
      if (jsonData.length > 0) {
        // Primera fila como encabezados
        const headers = jsonData[0];
        const rows = jsonData.slice(1);
        
        // Convertir a array de objetos
        const formattedData = rows.map(row => {
          const obj = {};
          headers.forEach((header, index) => {
            obj[header || `Column_${index + 1}`] = row[index] || null;
          });
          return obj;
        });
        
        allData.push(...formattedData);
      }
    }
    
    const jsonString = JSON.stringify(allData, null, 2);
    return new Blob([jsonString], { type: 'application/json; charset=utf-8' });
  } catch (error) {
    throw new Error("No se pudo convertir el archivo XLSX a JSON: " + error.message);
  }
}

// XLSX → XML (estructura jerárquica preservada)
export async function xlsxToXml(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    let xmlContent = '<?xml version="1.0" encoding="UTF-8"?>\n<data>\n';
    
    // Procesar todas las hojas
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        blankrows: false
      });
      
      if (jsonData.length > 0) {
        const headers = jsonData[0];
        const rows = jsonData.slice(1);
        
        // Agregar filas de datos directamente sin metadatos
        rows.forEach((row, rowIndex) => {
          xmlContent += `  <record>\n`;
          row.forEach((cell, cellIndex) => {
            const header = headers[cellIndex] || `field_${cellIndex}`;
            xmlContent += `    <${sanitizeTagName(header)}>${escapeXml(cell || '')}</${sanitizeTagName(header)}>\n`;
          });
          xmlContent += `  </record>\n`;
        });
      }
    }
    
    xmlContent += '</data>';
    
    return new Blob([xmlContent], { type: 'application/xml; charset=utf-8' });
  } catch (error) {
    throw new Error("No se pudo convertir el archivo XLSX a XML: " + error.message);
  }
}

// XLSX → PDF (preserva layout y formato visual)
export async function xlsxToPdf(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Usar ExcelJS para obtener formato avanzado
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);
    
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    let isFirstSheet = true;
    
    // Procesar cada hoja del workbook
    workbook.eachSheet((worksheet, sheetId) => {
      if (!isFirstSheet) {
        pdf.addPage();
      }
      isFirstSheet = false;
      
      // Extraer datos de la hoja sin títulos ni metadatos
      const tableData = [];
      const headers = [];
      
      // Obtener encabezados (primera fila)
      const firstRow = worksheet.getRow(1);
      firstRow.eachCell((cell, colNumber) => {
        headers.push(cell.value?.toString() || `Columna ${colNumber}`);
      });
      
      if (headers.length > 0) {
        // Configuración de la tabla - empezar desde arriba sin títulos
        const startX = 20;
        const startY = 20;
        const cellWidth = (pdf.internal.pageSize.getWidth() - 40) / headers.length;
        const cellHeight = 8;
        let currentY = startY;
        
        // Dibujar encabezados
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setFillColor(66, 139, 202);
        pdf.setTextColor(255, 255, 255);
        
        headers.forEach((header, index) => {
          const x = startX + (index * cellWidth);
          pdf.rect(x, currentY, cellWidth, cellHeight, 'F');
          pdf.text(header.substring(0, 15), x + 2, currentY + 6);
        });
        
        currentY += cellHeight;
        
        // Dibujar datos
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        let isAlternateRow = false;
        
        for (let rowNumber = 2; rowNumber <= Math.min(worksheet.rowCount, 50); rowNumber++) {
          const row = worksheet.getRow(rowNumber);
          const rowData = [];
          let hasData = false;
          
          for (let colNumber = 1; colNumber <= headers.length; colNumber++) {
            const cell = row.getCell(colNumber);
            let cellValue = '';
            
            if (cell.value !== null && cell.value !== undefined) {
              // Preservar formato de fecha
              if (cell.type === 'date') {
                cellValue = cell.value.toLocaleDateString();
              } else if (cell.type === 'number') {
                cellValue = cell.value.toString();
              } else {
                cellValue = cell.value.toString();
              }
              hasData = true;
            }
            
            rowData.push(cellValue);
          }
          
          // Solo dibujar filas que no estén completamente vacías
          if (hasData) {
            // Alternar color de fondo
            if (isAlternateRow) {
              pdf.setFillColor(245, 245, 245);
              pdf.rect(startX, currentY, pdf.internal.pageSize.getWidth() - 40, cellHeight, 'F');
            }
            
            // Dibujar celdas
            rowData.forEach((cellData, index) => {
              const x = startX + (index * cellWidth);
              pdf.text(cellData.substring(0, 15), x + 2, currentY + 6);
            });
            
            currentY += cellHeight;
            isAlternateRow = !isAlternateRow;
            
            // Verificar si necesitamos una nueva página
            if (currentY > pdf.internal.pageSize.getHeight() - 30) {
              pdf.addPage();
              currentY = 20;
              isAlternateRow = false;
            }
          }
        }
        
        // Agregar borde a toda la tabla
        pdf.setDrawColor(0, 0, 0);
        pdf.rect(startX, startY, pdf.internal.pageSize.getWidth() - 40, currentY - startY);
      }
    });
    
    return pdf.output('blob');
  } catch (error) {
    throw new Error("No se pudo convertir el archivo XLSX a PDF: " + error.message);
  }
}

// Funciones auxiliares
function escapeXml(text) {
  if (typeof text !== 'string') {
    text = String(text);
  }
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeTagName(name) {
  if (typeof name !== 'string') {
    name = String(name);
  }
  return name
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/^[^a-zA-Z_]/, '_');
}

// Exportar las opciones de conversión soportadas
export const XLSX_CONVERSION_OPTIONS = ['CSV', 'JSON', 'XML', 'PDF'];
