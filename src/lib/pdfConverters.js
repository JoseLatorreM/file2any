// pdfConverters.js - Conversiones robustas con preservación de formato
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Configurar el worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

/**
 * Extrae texto estructurado de PDF con información de posicionamiento y formato
 * @param {File} file - Archivo PDF
 * @returns {Promise<Object>} - Objeto con texto estructurado y metadatos
 */
export async function extractStructuredTextFromPDF(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    console.log(`Extrayendo texto estructurado de PDF con ${pdf.numPages} páginas...`);
    
    const pages = [];
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Extraer información de posicionamiento y formato
      const items = textContent.items.map(item => ({
        text: item.str
          .replace(/\u00A0/g, ' ') // Reemplazar espacios no separables
          .replace(/\u2013/g, '-') // Reemplazar guión en (–)
          .replace(/\u2014/g, '--') // Reemplazar guión em (—)
          .replace(/\u201C/g, '"') // Reemplazar comilla izquierda
          .replace(/\u201D/g, '"') // Reemplazar comilla derecha
          .replace(/\u2018/g, "'") // Reemplazar comilla simple izquierda
          .replace(/\u2019/g, "'") // Reemplazar comilla simple derecha
          .replace(/\u2022/g, '•') // Normalizar viñetas
          .trim(),
        x: Math.round(item.transform[4]),
        y: Math.round(item.transform[5]),
        width: Math.round(item.width),
        height: Math.round(item.height),
        fontSize: Math.round(item.height),
        fontName: item.fontName || 'unknown',
        dir: item.dir
      })).filter(item => item.text.length > 0); // Filtrar elementos vacíos
      
      pages.push({
        pageNumber: pageNum,
        items: items,
        viewport: page.getViewport({ scale: 1.0 })
      });
    }
    
    return { pages, totalPages: pdf.numPages };
    
  } catch (error) {
    console.error('Error al extraer texto estructurado:', error);
    throw new Error("No se pudo extraer texto estructurado del PDF: " + error.message);
  }
}

/**
 * Agrupa elementos de texto por líneas basándose en posición Y
 * @param {Array} items - Items de texto con posicionamiento
 * @returns {Array} - Líneas de texto agrupadas
 */
export function groupTextByLines(items) {
  // Ordenar por Y (de arriba a abajo) y luego por X (de izquierda a derecha)
  const sortedItems = items.sort((a, b) => {
    const yDiff = b.y - a.y; // Y invertido en PDF
    if (Math.abs(yDiff) < 5) { // Mismo nivel Y (tolerancia de 5px)
      return a.x - b.x; // Ordenar por X
    }
    return yDiff;
  });
  
  const lines = [];
  let currentLine = [];
  let currentY = null;
  
  sortedItems.forEach(item => {
    // Si es la primera línea o si está en una Y significativamente diferente
    if (currentY === null || Math.abs(item.y - currentY) > 5) {
      if (currentLine.length > 0) {
        lines.push({
          y: currentY,
          text: currentLine.map(i => i.text).join(' ')
            .replace(/\s+/g, ' ') // Normalizar espacios múltiples
            .replace(/\s*([.,;:!?])/g, '$1') // Quitar espacios antes de puntuación
            .trim(),
          items: currentLine,
          fontSize: Math.max(...currentLine.map(i => i.fontSize)),
          fontName: currentLine[0]?.fontName || 'unknown'
        });
      }
      currentLine = [item];
      currentY = item.y;
    } else {
      currentLine.push(item);
    }
  });
  
  // Agregar la última línea
  if (currentLine.length > 0) {
    lines.push({
      y: currentY,
      text: currentLine.map(i => i.text).join(' ')
        .replace(/\s+/g, ' ') // Normalizar espacios múltiples
        .replace(/\s*([.,;:!?])/g, '$1') // Quitar espacios antes de puntuación
        .trim(),
      items: currentLine,
      fontSize: Math.max(...currentLine.map(i => i.fontSize)),
      fontName: currentLine[0]?.fontName || 'unknown'
    });
  }
  
  return lines;
}

/**
 * Detecta y extrae tablas del contenido PDF basándose en alineación y posición
 * @param {Array} items - Items de texto con posicionamiento
 * @returns {Array} - Tablas detectadas con estructura
 */
export function detectTables(items) {
  // Agrupar elementos por filas (Y similar)
  const rows = [];
  const tolerance = 3; // Tolerancia para agrupar en la misma fila
  
  items.forEach(item => {
    let foundRow = rows.find(row => Math.abs(row.y - item.y) <= tolerance);
    
    if (foundRow) {
      foundRow.items.push(item);
    } else {
      rows.push({
        y: item.y,
        items: [item]
      });
    }
  });
  
  // Ordenar filas por posición Y
  rows.sort((a, b) => b.y - a.y);
  
  // Detectar patrones de tabla
  const tables = [];
  let currentTable = null;
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    // Ordenar elementos de la fila por posición X
    row.items.sort((a, b) => a.x - b.x);
    
    // Detectar si es una fila de tabla (múltiples columnas alineadas)
    const hasMultipleColumns = row.items.length >= 2;
    const hasConsistentSpacing = checkColumnAlignment(row.items);
    
    if (hasMultipleColumns && hasConsistentSpacing) {
      if (!currentTable) {
        // Iniciar nueva tabla
        currentTable = {
          startY: row.y,
          endY: row.y,
          rows: [],
          columns: analyzeColumns(row.items)
        };
      }
      
      // Agregar fila a la tabla actual
      currentTable.rows.push({
        y: row.y,
        cells: row.items.map(item => ({
          text: item.text.trim(),
          x: item.x,
          width: item.width
        }))
      });
      currentTable.endY = row.y;
      
    } else {
      // Si teníamos una tabla en progreso, finalizarla
      if (currentTable && currentTable.rows.length >= 2) {
        tables.push(currentTable);
      }
      currentTable = null;
    }
  }
  
  // Agregar la última tabla si existe
  if (currentTable && currentTable.rows.length >= 2) {
    tables.push(currentTable);
  }
  
  return tables;
}

/**
 * Verifica si los elementos están alineados en columnas
 * @param {Array} items - Elementos de una fila
 * @returns {boolean} - Si están alineados consistentemente
 */
function checkColumnAlignment(items) {
  if (items.length < 2) return false;
  
  // Verificar espaciado mínimo entre columnas
  for (let i = 0; i < items.length - 1; i++) {
    const spacing = items[i + 1].x - (items[i].x + items[i].width);
    if (spacing < 10) return false; // Espacio mínimo entre columnas
  }
  
  return true;
}

/**
 * Analiza las posiciones de columnas en una fila
 * @param {Array} items - Elementos de una fila
 * @returns {Array} - Información de columnas
 */
function analyzeColumns(items) {
  return items.map((item, index) => ({
    index: index,
    x: item.x,
    width: item.width,
    rightEdge: item.x + item.width
  }));
}

/**
 * Convierte tablas detectadas a formato HTML
 * @param {Array} tables - Tablas detectadas
 * @returns {string} - HTML de las tablas
 */
function tablesToHtml(tables) {
  let html = '';
  
  tables.forEach((table, tableIndex) => {
    html += `<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; margin: 12pt 0; width: 100%;">\n`;
    
    table.rows.forEach((row, rowIndex) => {
      const tag = rowIndex === 0 ? 'th' : 'td'; // Primera fila como encabezado
      html += '<tr>\n';
      
      row.cells.forEach(cell => {
        const style = rowIndex === 0 ? 
          'background-color: #f2f2f2; font-weight: bold; text-align: center;' : 
          'text-align: left;';
        html += `<${tag} style="${style}">${escapeHtml(cell.text)}</${tag}>\n`;
      });
      
      html += '</tr>\n';
    });
    
    html += '</table>\n';
  });
  
  return html;
}

/**
 * Detecta encabezados basándose en tamaño de fuente y posición
 * @param {Array} lines - Líneas de texto agrupadas
 * @returns {Array} - Líneas con información de encabezado
 */
export function detectHeadings(lines) {
  if (lines.length === 0) return lines;
  
  // Calcular tamaño de fuente promedio
  const fontSizes = lines.map(line => line.fontSize);
  const avgFontSize = fontSizes.reduce((a, b) => a + b, 0) / fontSizes.length;
  const maxFontSize = Math.max(...fontSizes);
  
  return lines.map(line => {
    let headingLevel = 0;
    
    // Detectar encabezados por tamaño de fuente
    if (line.fontSize > avgFontSize * 1.5) {
      headingLevel = 1; // H1 para fuentes muy grandes
    } else if (line.fontSize > avgFontSize * 1.3) {
      headingLevel = 2; // H2 para fuentes grandes
    } else if (line.fontSize > avgFontSize * 1.1) {
      headingLevel = 3; // H3 para fuentes moderadamente grandes
    }
    
    // Detectar por nombre de fuente (Bold, etc.)
    if (line.fontName.toLowerCase().includes('bold') && headingLevel === 0) {
      headingLevel = line.fontSize >= avgFontSize ? 3 : 0;
    }
    
    // Detectar patrones de encabezado en el texto
    const text = line.text.trim();
    if (/^(CAPÍTULO|CHAPTER|SECCIÓN|SECTION)\s+\d+/i.test(text)) {
      headingLevel = Math.max(headingLevel, 1);
    } else if (/^\d+\.\s/.test(text) && text.length < 100) {
      headingLevel = Math.max(headingLevel, 2);
    } else if (/^\d+\.\d+\s/.test(text) && text.length < 80) {
      headingLevel = Math.max(headingLevel, 3);
    }
    
    return {
      ...line,
      isHeading: headingLevel > 0,
      headingLevel: headingLevel
    };
  });
}

/**
 * PDF → TXT preservando estructura, espaciado y jerarquía
 * @param {File} file - Archivo PDF
 * @returns {Promise<Blob>} - Archivo TXT estructurado
 */
export async function pdfToTxt(file) {
  try {
    console.log('Convirtiendo PDF a TXT con preservación de estructura...');
    
    // Extraer estructura completa
    const structuredData = await extractStructuredTextFromPDF(file);
    let result = '';
    
    for (const pageData of structuredData.pages) {
      // Agregar separador de página
      if (pageData.pageNumber > 1) {
        result += '\n\n' + '='.repeat(60) + '\n';
        result += `PÁGINA ${pageData.pageNumber}`;
        result += '\n' + '='.repeat(60) + '\n\n';
      }
      
      // Agrupar texto por líneas y detectar encabezados
      const lines = groupTextByLines(pageData.items);
      const linesWithHeadings = detectHeadings(lines);
      
      for (const line of linesWithHeadings) {
        if (!line.text.trim()) continue;
        
        if (line.isHeading) {
          // Formatear encabezados con marcos visuales
          const padding = '='.repeat(Math.max(5, 50 - line.headingLevel * 10));
          result += '\n\n' + padding + '\n';
          result += line.text.toUpperCase();
          result += '\n' + padding + '\n\n';
        } else {
          // Detectar si es una lista por patrones en el texto
          const text = line.text.trim();
          if (/^\d+[\.\)]\s/.test(text) || /^[•\-\*]\s/.test(text)) {
            result += '    ' + text + '\n'; // Indentar listas
          } else if (/^\s*[\-\•]\s/.test(text)) {
            result += '  ' + text + '\n'; // Indentar viñetas
          } else {
            result += text + '\n';
          }
        }
      }
      
      result += '\n'; // Espacio entre secciones
    }
    
    // Limpiar y optimizar el resultado
    result = result
      .replace(/\n{4,}/g, '\n\n\n') // Máximo 3 saltos de línea
      .replace(/[ \t]+/g, ' ') // Múltiples espacios a uno solo
      .trim();
    
    console.log(`PDF→TXT: Extraído ${result.length} caracteres de ${structuredData.totalPages} páginas`);
    return new Blob([result], { type: 'text/plain; charset=utf-8' });
    
  } catch (error) {
    console.error('Error en conversión PDF→TXT:', error);
    throw new Error("No se pudo convertir el archivo PDF a TXT: " + error.message);
  }
}

/**
 * PDF → Markdown preservando estructura y formato
 * @param {File} file - Archivo PDF
 * @returns {Promise<Blob>} - Archivo Markdown
 */
export async function pdfToMarkdown(file) {
  try {
    console.log('Convirtiendo PDF a Markdown con preservación de formato...');
    
    // Extraer estructura completa
    const structuredData = await extractStructuredTextFromPDF(file);
    let markdown = '';
    
    // Agregar título del documento
    markdown += `# Documento PDF\n\n`;
    markdown += `*Convertido desde PDF - ${structuredData.totalPages} páginas*\n\n`;
    markdown += `---\n\n`;
    
    for (const pageData of structuredData.pages) {
      // Agregar marcador de página para documentos largos
      if (pageData.pageNumber > 1) {
        markdown += `\n\n## Página ${pageData.pageNumber}\n\n`;
      }
      
      // Agrupar texto por líneas y detectar encabezados
      const lines = groupTextByLines(pageData.items);
      const linesWithHeadings = detectHeadings(lines);
      
      let listCounter = 0;
      
      for (const line of linesWithHeadings) {
        if (!line.text.trim()) continue;
        
        const text = line.text.trim();
        
        if (line.isHeading) {
          // Convertir encabezados a Markdown
          const hashes = '#'.repeat(Math.min(line.headingLevel + 1, 6));
          markdown += `\n\n${hashes} ${text}\n\n`;
          listCounter = 0; // Reset counter para nuevas secciones
        } else {
          // Detectar diferentes tipos de contenido
          if (/^\d+[\.\)]\s/.test(text)) {
            // Lista numerada
            listCounter++;
            markdown += `${listCounter}. ${text.replace(/^\d+[\.\)]\s/, '')}\n`;
          } else if (/^[•\-\*]\s/.test(text)) {
            // Lista con viñetas
            markdown += `- ${text.replace(/^[•\-\*]\s/, '')}\n`;
          } else if (/^[A-Z\s]+:/.test(text) && text.length < 100) {
            // Posibles subtítulos o etiquetas
            markdown += `\n**${text}**\n\n`;
          } else if (text.length < 50 && /^[A-Z]/.test(text) && !/\.$/.test(text)) {
            // Posibles encabezados menores
            markdown += `\n### ${text}\n\n`;
          } else {
            // Párrafo normal
            markdown += `${text}\n\n`;
            listCounter = 0;
          }
        }
      }
    }
    
    // Limpiar markdown
    markdown = markdown
      .replace(/\n{4,}/g, '\n\n\n') // Máximo 3 saltos de línea
      .replace(/\s+$/gm, '') // Espacios al final de línea
      .trim();
    
    console.log(`PDF→MD: Generado ${markdown.length} caracteres de Markdown`);
    return new Blob([markdown], { type: 'text/markdown; charset=utf-8' });
    
  } catch (error) {
    console.error('Error en conversión PDF→MD:', error);
    throw new Error("No se pudo convertir el archivo PDF a Markdown: " + error.message);
  }
}

/**
 * PDF → DOCX preservando estructura y formato (conversión avanzada)
 * @param {File} file - Archivo PDF
 * @returns {Promise<Blob>} - Archivo DOCX
 */
export async function pdfToDocx(file) {
  try {
    console.log('Convirtiendo PDF a DOCX con preservación de formato...');
    
    // Extraer estructura completa
    const structuredData = await extractStructuredTextFromPDF(file);
    
    // Crear contenido HTML que Word puede importar correctamente
    let htmlContent = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="ProgId" content="Word.Document">
    <meta name="Generator" content="File2Any Converter">
    <meta name="Originator" content="Microsoft Word">
    <title>Documento Convertido desde PDF</title>
    <!--[if gte mso 9]>
    <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>90</w:Zoom>
            <w:DoNotPromptForConvert/>
            <w:DoNotShowRevisions/>
            <w:DoNotPrintRevisions/>
            <w:DisplayHorizontalDrawingGridEvery>0</w:DisplayHorizontalDrawingGridEvery>
            <w:DisplayVerticalDrawingGridEvery>2</w:DisplayVerticalDrawingGridEvery>
            <w:UseMarginsForDrawingGridOrigin/>
        </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
        @page {
            margin: 2.54cm;
        }
        body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.5;
            margin: 0;
            padding: 0;
            background-color: white;
            color: black;
        }
        h1 {
            font-size: 18pt;
            font-weight: bold;
            margin: 24pt 0 12pt 0;
            color: #1f497d;
            page-break-after: avoid;
        }
        h2 {
            font-size: 16pt;
            font-weight: bold;
            margin: 18pt 0 6pt 0;
            color: #1f497d;
            page-break-after: avoid;
        }
        h3 {
            font-size: 14pt;
            font-weight: bold;
            margin: 12pt 0 6pt 0;
            color: #1f497d;
            page-break-after: avoid;
        }
        p {
            margin: 6pt 0;
            text-align: justify;
            orphans: 2;
            widows: 2;
        }
        ul, ol {
            margin: 12pt 0;
            padding-left: 36pt;
        }
        li {
            margin: 3pt 0;
            text-align: justify;
        }
        .page-break {
            page-break-before: always;
            margin: 24pt 0;
            text-align: center;
            font-weight: bold;
            color: #666;
            font-size: 10pt;
        }
        .code {
            font-family: 'Courier New', monospace;
            background-color: #f8f8f8;
            padding: 12pt;
            border: 1pt solid #e1e1e1;
            margin: 12pt 0;
            white-space: pre-wrap;
        }
        strong, b {
            font-weight: bold;
        }
        em, i {
            font-style: italic;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 12pt 0;
            font-size: 11pt;
        }
        th, td {
            border: 1pt solid #000;
            padding: 6pt 8pt;
            text-align: left;
            vertical-align: top;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
            text-align: center;
        }
        td {
            background-color: white;
        }
    </style>
</head>
<body lang="ES-MX">`;

    // Procesar cada página
    for (const pageData of structuredData.pages) {
      // Agregar separador de página si no es la primera
      if (pageData.pageNumber > 1) {
        htmlContent += `<div class="page-break">--- Página ${pageData.pageNumber} ---</div>\n`;
      }
      
      // Detectar tablas en la página
      const tables = detectTables(pageData.items);
      
      // Crear un mapa de posiciones ocupadas por tablas
      const tablePositions = new Set();
      tables.forEach(table => {
        for (let y = table.endY; y <= table.startY; y += 5) {
          tablePositions.add(Math.round(y / 5) * 5);
        }
      });
      
      // Filtrar elementos que no están en tablas para procesamiento normal
      const nonTableItems = pageData.items.filter(item => {
        const roundedY = Math.round(item.y / 5) * 5;
        return !tablePositions.has(roundedY);
      });
      
      // Agrupar texto por líneas (excluyendo elementos de tablas)
      const lines = groupTextByLines(nonTableItems);
      const linesWithHeadings = detectHeadings(lines);
      
      // Combinar contenido normal y tablas, ordenado por posición Y
      const allContent = [];
      
      // Agregar líneas normales
      linesWithHeadings.forEach(line => {
        allContent.push({
          type: 'text',
          y: line.y,
          content: line
        });
      });
      
      // Agregar tablas
      tables.forEach(table => {
        allContent.push({
          type: 'table',
          y: table.startY,
          content: table
        });
      });
      
      // Ordenar todo el contenido por posición Y
      allContent.sort((a, b) => b.y - a.y);
      
      let inList = false;
      let listType = '';
      
      // Procesar contenido ordenado
      for (const item of allContent) {
        if (item.type === 'table') {
          // Cerrar lista si estaba abierta
          if (inList) {
            htmlContent += `</${listType}>\n`;
            inList = false;
          }
          
          // Renderizar tabla
          htmlContent += tablesToHtml([item.content]);
          
        } else {
          // Procesar línea de texto normal
          const line = item.content;
          if (!line.text.trim()) continue;
          
          const text = escapeHtml(line.text.trim());
          
          if (line.isHeading) {
            // Cerrar lista si estaba abierta
            if (inList) {
              htmlContent += `</${listType}>\n`;
              inList = false;
            }
            
            // Crear encabezado según el nivel
            if (line.headingLevel === 1) {
              htmlContent += `<h1>${text}</h1>\n`;
            } else if (line.headingLevel === 2) {
              htmlContent += `<h2>${text}</h2>\n`;
            } else {
              htmlContent += `<h3>${text}</h3>\n`;
            }
          } else {
            // Detectar tipo de contenido
            if (/^\d+[\.\)]\s/.test(line.text)) {
              // Lista numerada
              const listText = text.replace(/^\d+[\.\)]\s/, '');
              
              if (!inList || listType !== 'ol') {
                if (inList) htmlContent += `</${listType}>\n`;
                htmlContent += '<ol>\n';
                inList = true;
                listType = 'ol';
              }
              htmlContent += `<li>${listText}</li>\n`;
            } else if (/^[•\-\*]\s/.test(line.text)) {
              // Lista con viñetas
              const listText = text.replace(/^[•\-\*]\s/, '');
              
              if (!inList || listType !== 'ul') {
                if (inList) htmlContent += `</${listType}>\n`;
                htmlContent += '<ul>\n';
                inList = true;
                listType = 'ul';
              }
              htmlContent += `<li>${listText}</li>\n`;
            } else {
              // Cerrar lista si estaba abierta
              if (inList) {
                htmlContent += `</${listType}>\n`;
                inList = false;
              }
              
              // Detectar código (líneas que empiezan con espacios)
              if (/^\s{4,}/.test(line.text)) {
                htmlContent += `<div class="code">${text}</div>\n`;
              } else {
                // Párrafo normal
                htmlContent += `<p>${text}</p>\n`;
              }
            }
          }
        }
      }
      
      // Cerrar lista al final de la página si estaba abierta
      if (inList) {
        htmlContent += `</${listType}>\n`;
        inList = false;
      }
    }
    
    htmlContent += '</body></html>';
    
    console.log(`PDF→DOCX: Generado documento HTML compatible con Word de ${structuredData.totalPages} páginas`);
    
    // Crear blob con el tipo MIME correcto para que Word lo reconozca
    return new Blob([htmlContent], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    
  } catch (error) {
    console.error('Error en conversión PDF→DOCX:', error);
    throw new Error("No se pudo convertir el archivo PDF a DOCX: " + error.message);
  }
}

/**
 * Escapa caracteres HTML para evitar problemas de renderizado
 * @param {string} text - Texto a escapar
 * @returns {string} - Texto escapado
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

// Exportar las opciones de conversión soportadas
export const PDF_CONVERSION_OPTIONS = ['DOCX', 'TXT', 'MD'];
