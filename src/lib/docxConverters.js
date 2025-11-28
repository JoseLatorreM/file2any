// docxConverters.js - Conversiones robustas con preservación de formato
import mammoth from 'mammoth';
import jsPDF from 'jspdf';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * DOCX → TXT preservando estructura, espaciado y formato
 * @param {File} file - Archivo DOCX
 * @returns {Promise<Blob>} - Archivo TXT con estructura preservada
 */
export async function docxToTxt(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Primero extraer con estructura HTML para preservar formato
    const htmlResult = await mammoth.convertToHtml({ 
      arrayBuffer,
      options: {
        styleMap: [
          "p[style-name='Heading 1'] => h1",
          "p[style-name='Heading 2'] => h2", 
          "p[style-name='Heading 3'] => h3",
          "p[style-name='Title'] => h1",
          "p[style-name='Subtitle'] => h2",
          "b => strong",
          "i => em"
        ]
      }
    });
    
    // Convertir HTML a texto estructurado
    let structuredText = convertHtmlToStructuredText(htmlResult.value);
    
    // También extraer texto plano como fallback
    const textResult = await mammoth.extractRawText({ arrayBuffer });
    
    if (!structuredText && !textResult.value) {
      throw new Error("No se pudo extraer texto del archivo DOCX");
    }
    
    // Usar texto estructurado si está disponible, sino el texto plano
    let finalText = structuredText || textResult.value;
    
    // Limpiar y preservar estructura
    finalText = finalText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{4,}/g, '\n\n\n') // Máximo 3 saltos de línea
      .replace(/[ \t]+/g, ' ') // Múltiples espacios a uno solo
      .trim();
    
    console.log(`DOCX→TXT: Extraído ${finalText.length} caracteres`);
    return new Blob([finalText], { type: 'text/plain; charset=utf-8' });
  } catch (error) {
    console.error('Error en conversión DOCX→TXT:', error);
    throw new Error("No se pudo convertir el archivo DOCX a TXT: " + error.message);
  }
}

/**
 * Convierte HTML a texto estructurado preservando jerarquía
 * @param {string} html - Contenido HTML
 * @returns {string} - Texto estructurado
 */
function convertHtmlToStructuredText(html) {
  // Crear un parser DOM temporal
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  let result = '';
  
  function processNode(node, level = 0) {
    const indent = '  '.repeat(level);
    
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      if (text) {
        result += text + ' ';
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();
      
      switch (tagName) {
        case 'h1':
          result += '\n\n' + '='.repeat(50) + '\n';
          for (const child of node.childNodes) {
            processNode(child, level);
          }
          result += '\n' + '='.repeat(50) + '\n\n';
          break;
          
        case 'h2':
          result += '\n\n' + '-'.repeat(30) + '\n';
          for (const child of node.childNodes) {
            processNode(child, level);
          }
          result += '\n' + '-'.repeat(30) + '\n\n';
          break;
          
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          result += '\n\n### ';
          for (const child of node.childNodes) {
            processNode(child, level);
          }
          result += ' ###\n\n';
          break;
          
        case 'p':
          result += '\n';
          for (const child of node.childNodes) {
            processNode(child, level);
          }
          result += '\n';
          break;
          
        case 'strong':
          result += '**';
          for (const child of node.childNodes) {
            processNode(child, level);
          }
          result += '**';
          break;
          
        case 'em':
          result += '*';
          for (const child of node.childNodes) {
            processNode(child, level);
          }
          result += '*';
          break;
          
        case 'ul':
        case 'ol':
          result += '\n';
          for (const child of node.childNodes) {
            processNode(child, level);
          }
          result += '\n';
          break;
          
        case 'li':
          result += '\n• ';
          for (const child of node.childNodes) {
            processNode(child, level);
          }
          break;
          
        case 'table':
          result += '\n\n[TABLA]\n';
          result += '=' .repeat(50) + '\n';
          
          const tableRows = node.querySelectorAll('tr');
          tableRows.forEach((row, rowIndex) => {
            const cells = row.querySelectorAll('td, th');
            let rowText = '';
            
            cells.forEach((cell, cellIndex) => {
              const cellContent = cell.textContent.trim();
              rowText += cellContent;
              if (cellIndex < cells.length - 1) {
                rowText += ' | ';
              }
            });
            
            // Marcar encabezados
            if (rowIndex === 0 || row.querySelectorAll('th').length > 0) {
              result += '*** ' + rowText + ' ***\n';
              if (rowIndex === 0 && tableRows.length > 1) {
                result += '-'.repeat(Math.min(rowText.length + 8, 50)) + '\n';
              }
            } else {
              result += rowText + '\n';
            }
          });
          
          result += '=' .repeat(50) + '\n\n';
          break;
          
        default:
          for (const child of node.childNodes) {
            processNode(child, level);
          }
      }
    }
  }
  
  processNode(doc.body);
  
  return result
    .replace(/\n{4,}/g, '\n\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * DOCX → Markdown preservando formato completo y estructura
 * @param {File} file - Archivo DOCX
 * @returns {Promise<Blob>} - Archivo Markdown
 */
export async function docxToMarkdown(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    console.log('Convirtiendo DOCX a Markdown con preservación de formato...');
    
    // Configuración robusta para detectar estilos y formato
    const options = {
      styleMap: [
        // Encabezados principales con mejor detección
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh", 
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Heading 5'] => h5:fresh",
        "p[style-name='Heading 6'] => h6:fresh",
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Subtitle'] => h2:fresh",
        
        // Texto con formato
        "r[style-name='Strong'] => strong",
        "r[style-name='Emphasis'] => em",
        "b => strong", // Negritas directas
        "i => em",     // Cursivas directas
        "u => u",      // Subrayado
        
        // Listas y párrafos especiales
        "p[style-name='List Paragraph'] => p:fresh",
        "p[style-name='Quote'] => blockquote:fresh",
        "p[style-name='Caption'] => p.caption:fresh",
        
        // Tablas con mejor mapeo
        "table => table:fresh",
        "tr => tr:fresh",
        "td => td:fresh",
        "th => th:fresh"
      ],
      
      // Configuraciones adicionales para tablas
      includeEmbeddedStyleMap: true,
      includeDefaultStyleMap: true,
      
      // Transformaciones personalizadas para preservar estructura de tabla
      transformDocument: function(element) {
        if (element.type === "table") {
          return {
            ...element,
            // Preservar propiedades de tabla
            properties: element.properties || {}
          };
        }
        return element;
      }
    };
    
    const result = await mammoth.convertToHtml({ arrayBuffer, options });
    
    if (!result.value) {
      throw new Error("No se pudo extraer contenido del archivo DOCX");
    }
    
    // Convertir HTML a Markdown
    let markdown = convertHtmlToMarkdown(result.value);
    
    // Procesar advertencias de Mammoth
    if (result.messages && result.messages.length > 0) {
      console.log('Advertencias de conversión:', result.messages);
    }
    
    console.log(`DOCX→MD: Generado ${markdown.length} caracteres de Markdown`);
    return new Blob([markdown], { type: 'text/markdown; charset=utf-8' });
    
  } catch (error) {
    console.error('Error en conversión DOCX→MD:', error);
    throw new Error("No se pudo convertir el archivo DOCX a Markdown: " + error.message);
  }
}

/**
 * Convierte HTML a Markdown preservando formato
 * @param {string} html - Contenido HTML
 * @returns {string} - Contenido Markdown
 */
function convertHtmlToMarkdown(html) {
  // Crear parser DOM
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  let markdown = '';
  let listCounter = 0;
  
  function processNode(node, listLevel = 0) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (text.trim()) {
        markdown += text;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tagName = node.tagName.toLowerCase();
      
      switch (tagName) {
        case 'h1':
          markdown += '\n\n# ';
          processChildren(node);
          markdown += '\n\n';
          break;
          
        case 'h2':
          markdown += '\n\n## ';
          processChildren(node);
          markdown += '\n\n';
          break;
          
        case 'h3':
          markdown += '\n\n### ';
          processChildren(node);
          markdown += '\n\n';
          break;
          
        case 'h4':
          markdown += '\n\n#### ';
          processChildren(node);
          markdown += '\n\n';
          break;
          
        case 'h5':
          markdown += '\n\n##### ';
          processChildren(node);
          markdown += '\n\n';
          break;
          
        case 'h6':
          markdown += '\n\n###### ';
          processChildren(node);
          markdown += '\n\n';
          break;
          
        case 'p':
          // Verificar si es una lista numerada por el contenido
          const textContent = node.textContent.trim();
          const isNumberedList = /^\d+[\.\)]\s/.test(textContent);
          const isBulletList = /^[•\-\*]\s/.test(textContent);
          
          if (isNumberedList) {
            listCounter++;
            markdown += `\n${listCounter}. `;
            processChildren(node);
            markdown += '\n';
          } else if (isBulletList) {
            markdown += '\n- ';
            // Remover el marcador original
            const cleanText = textContent.replace(/^[•\-\*]\s/, '');
            markdown += cleanText;
            markdown += '\n';
          } else {
            markdown += '\n\n';
            processChildren(node);
            markdown += '\n';
          }
          break;
          
        case 'strong':
        case 'b':
          markdown += '**';
          processChildren(node);
          markdown += '**';
          break;
          
        case 'em':
        case 'i':
          markdown += '*';
          processChildren(node);
          markdown += '*';
          break;
          
        case 'u':
          markdown += '<u>';
          processChildren(node);
          markdown += '</u>';
          break;
          
        case 'blockquote':
          markdown += '\n\n> ';
          processChildren(node);
          markdown += '\n\n';
          break;
          
        case 'ul':
          markdown += '\n';
          for (const li of node.children) {
            if (li.tagName.toLowerCase() === 'li') {
              markdown += '- ';
              processChildren(li);
              markdown += '\n';
            }
          }
          markdown += '\n';
          break;
          
        case 'ol':
          markdown += '\n';
          let counter = 1;
          for (const li of node.children) {
            if (li.tagName.toLowerCase() === 'li') {
              markdown += `${counter}. `;
              processChildren(li);
              markdown += '\n';
              counter++;
            }
          }
          markdown += '\n';
          break;
          
        case 'table':
          markdown += '\n\n';
          processTable(node);
          markdown += '\n\n';
          break;
          
        case 'br':
          markdown += '\n';
          break;
          
        case 'hr':
          markdown += '\n\n---\n\n';
          break;
          
        case 'a':
          const href = node.getAttribute('href');
          if (href) {
            markdown += '[';
            processChildren(node);
            markdown += `](${href})`;
          } else {
            processChildren(node);
          }
          break;
          
        case 'img':
          const src = node.getAttribute('src');
          const alt = node.getAttribute('alt') || 'imagen';
          if (src) {
            markdown += `![${alt}](${src})`;
          }
          break;
          
        default:
          processChildren(node);
      }
    }
    
    function processChildren(element) {
      for (const child of element.childNodes) {
        processNode(child, listLevel);
      }
    }
  }
  
  function processTable(table) {
    const rows = table.querySelectorAll('tr');
    if (rows.length === 0) return;
    
    // Determinar el número máximo de columnas
    let maxColumns = 0;
    rows.forEach(row => {
      const cells = row.querySelectorAll('td, th');
      maxColumns = Math.max(maxColumns, cells.length);
    });
    
    // Procesar encabezados (primera fila)
    const headerRow = rows[0];
    const headers = headerRow.querySelectorAll('th, td');
    
    markdown += '\n| ';
    for (let i = 0; i < maxColumns; i++) {
      const header = headers[i];
      const cellText = header ? header.textContent.trim() : '';
      markdown += cellText + ' | ';
    }
    markdown += '\n';
    
    // Línea separadora
    markdown += '|';
    for (let i = 0; i < maxColumns; i++) {
      markdown += ' --- |';
    }
    markdown += '\n';
    
    // Procesar filas de datos
    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].querySelectorAll('td, th');
      markdown += '| ';
      
      for (let j = 0; j < maxColumns; j++) {
        const cell = cells[j];
        let cellText = '';
        
        if (cell) {
          // Preservar formato básico dentro de las celdas
          cellText = cell.innerHTML
            .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
            .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
            .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
            .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
            .replace(/<br\s*\/?>/gi, ' ')
            .replace(/<[^>]*>/g, '') // Remover otras etiquetas HTML
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
        }
        
        markdown += cellText + ' | ';
      }
      markdown += '\n';
    }
    markdown += '\n';
  }
  
  processNode(doc.body);
  
  // Limpiar markdown
  return markdown
    .replace(/\n{4,}/g, '\n\n\n') // Máximo 3 saltos de línea
    .replace(/\s+$/gm, '') // Espacios al final de línea
    .trim();
}

/**
 * DOCX → PDF preservando formato original y estructura
 * @param {File} file - Archivo DOCX
 * @returns {Promise<Blob>} - Archivo PDF
 */
export async function docxToPdf(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    console.log('Convirtiendo DOCX a PDF con preservación de formato...');
    
    // Extraer contenido con formato preservado
    const options = {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh", 
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Title'] => h1:fresh",
        "p[style-name='Subtitle'] => h2:fresh",
        "r[style-name='Strong'] => strong",
        "r[style-name='Emphasis'] => em",
        "b => strong",
        "i => em",
        "u => u",
        "table => table",
        "tr => tr",
        "td => td",
        "th => th"
      ],
      includeEmbeddedStyleMap: true,
      includeDefaultStyleMap: true
    };
    
    const result = await mammoth.convertToHtml({ arrayBuffer, options });
    
    if (!result.value) {
      throw new Error("No se pudo extraer contenido del archivo DOCX");
    }
    
    // Crear PDF con jsPDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Configurar fuentes y estilos
    pdf.setFont('helvetica');
    pdf.setFontSize(12);
    
    let y = 20;
    const margin = 20;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const maxWidth = pageWidth - 2 * margin;
    
    // Procesar HTML elemento por elemento para preservar formato
    const parser = new DOMParser();
    const doc = parser.parseFromString(result.value, 'text/html');
    
    function addTextToPdf(text, fontSize = 12, fontStyle = 'normal', indent = 0) {
      if (!text.trim()) return;
      
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', fontStyle);
      
      const lines = pdf.splitTextToSize(text.trim(), maxWidth - indent);
      
      lines.forEach((line) => {
        if (y > 280) { // Nueva página si es necesario
          pdf.addPage();
          y = 20;
        }
        
        pdf.text(line, margin + indent, y);
        y += fontSize * 0.4 + 2; // Espaciado basado en tamaño de fuente
      });
    }
    
    function processElement(element) {
      const tagName = element.tagName.toLowerCase();
      const textContent = element.textContent.trim();
      
      switch (tagName) {
        case 'h1':
          y += 10; // Espacio extra antes del encabezado
          addTextToPdf(textContent, 18, 'bold');
          y += 8; // Espacio extra después del encabezado
          break;
          
        case 'h2':
          y += 8;
          addTextToPdf(textContent, 16, 'bold');
          y += 6;
          break;
          
        case 'h3':
          y += 6;
          addTextToPdf(textContent, 14, 'bold');
          y += 4;
          break;
          
        case 'h4':
          y += 4;
          addTextToPdf(textContent, 13, 'bold');
          y += 3;
          break;
          
        case 'p':
          // Detectar si es una lista por el contenido
          if (/^\d+[\.\)]\s/.test(textContent)) {
            addTextToPdf(textContent, 12, 'normal', 5);
          } else if (/^[•\-\*]\s/.test(textContent)) {
            addTextToPdf(textContent, 12, 'normal', 5);
          } else {
            addTextToPdf(textContent, 12, 'normal');
          }
          y += 4; // Espacio entre párrafos
          break;
          
        case 'strong':
        case 'b':
          addTextToPdf(textContent, 12, 'bold');
          break;
          
        case 'em':
        case 'i':
          addTextToPdf(textContent, 12, 'italic');
          break;
          
        case 'ul':
        case 'ol':
          // Procesar elementos de lista
          const listItems = element.querySelectorAll('li');
          listItems.forEach((li, index) => {
            const marker = tagName === 'ol' ? `${index + 1}. ` : '• ';
            addTextToPdf(marker + li.textContent.trim(), 12, 'normal', 5);
          });
          y += 4;
          break;
          
        case 'table':
          // Procesar tablas en PDF
          y += 6;
          const tableRows = element.querySelectorAll('tr');
          
          if (tableRows.length > 0) {
            // Agregar título de tabla
            addTextToPdf('[TABLA]', 10, 'bold');
            y += 3;
            
            tableRows.forEach((row, rowIndex) => {
              const cells = row.querySelectorAll('td, th');
              let rowText = '';
              
              cells.forEach((cell, cellIndex) => {
                const cellContent = cell.textContent.trim();
                rowText += cellContent;
                if (cellIndex < cells.length - 1) rowText += ' | ';
              });
              
              // Encabezados en negrita
              const isHeader = rowIndex === 0 || row.querySelectorAll('th').length > 0;
              addTextToPdf(rowText, 10, isHeader ? 'bold' : 'normal', 5);
              
              // Línea separadora después del encabezado
              if (rowIndex === 0 && tableRows.length > 1) {
                addTextToPdf('─'.repeat(Math.min(rowText.length, 50)), 8, 'normal', 5);
              }
            });
          }
          y += 6;
          break;
          
        default:
          // Para otros elementos, procesar recursivamente
          for (const child of element.children) {
            processElement(child);
          }
      }
    }
    
    // Procesar todo el documento
    for (const element of doc.body.children) {
      processElement(element);
    }
    
    console.log(`DOCX→PDF: Generado PDF con ${pdf.getNumberOfPages()} páginas`);
    return pdf.output('blob');
    
  } catch (error) {
    console.error('Error en conversión DOCX→PDF:', error);
    throw new Error("No se pudo convertir el archivo DOCX a PDF: " + error.message);
  }
}

// Exportar las opciones de conversión soportadas
export const DOCX_CONVERSION_OPTIONS = ['PDF', 'TXT', 'MD'];
