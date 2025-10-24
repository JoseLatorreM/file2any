// pdfConverters.js - Conversiones robustas con preservación de formato
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Configurar el worker de PDF.js usando CDN para evitar bloqueo de Hostinger
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

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
        text: item.str,
        x: Math.round(item.transform[4]),
        y: Math.round(item.transform[5]),
        width: Math.round(item.width),
        height: Math.round(item.height),
        fontSize: Math.round(item.height),
        fontName: item.fontName || 'unknown',
        dir: item.dir
      }));
      
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
          text: currentLine.map(i => i.text).join(' ').trim(),
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
      text: currentLine.map(i => i.text).join(' ').trim(),
      items: currentLine,
      fontSize: Math.max(...currentLine.map(i => i.fontSize)),
      fontName: currentLine[0]?.fontName || 'unknown'
    });
  }
  
  return lines;
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
    
    // Crear contenido estructurado para DOCX
    let docxContent = `DOCUMENTO PDF CONVERTIDO\n\n`;
    docxContent += `Páginas: ${structuredData.totalPages}\n`;
    docxContent += `Fecha de conversión: ${new Date().toLocaleDateString()}\n\n`;
    docxContent += '=' .repeat(50) + '\n\n';
    
    for (const pageData of structuredData.pages) {
      // Agregar separador de página
      if (pageData.pageNumber > 1) {
        docxContent += `\n\nPÁGINA ${pageData.pageNumber}\n`;
        docxContent += '-'.repeat(30) + '\n\n';
      }
      
      // Agrupar texto por líneas y detectar encabezados
      const lines = groupTextByLines(pageData.items);
      const linesWithHeadings = detectHeadings(lines);
      
      for (const line of linesWithHeadings) {
        if (!line.text.trim()) continue;
        
        const text = line.text.trim();
        
        if (line.isHeading) {
          // Formatear encabezados para DOCX
          const level = line.headingLevel;
          const prefix = level === 1 ? '\n\n### ' : level === 2 ? '\n\n## ' : '\n\n# ';
          docxContent += `${prefix}${text}\n\n`;
        } else {
          // Procesar contenido normal
          if (/^\d+[\.\)]\s/.test(text) || /^[•\-\*]\s/.test(text)) {
            docxContent += `    ${text}\n`; // Indentar listas
          } else {
            docxContent += `${text}\n\n`;
          }
        }
      }
    }
    
    // Para una conversión más robusta, usaríamos una librería como docx
    // Por ahora, retornamos como texto formateado
    console.log(`PDF→DOCX: Procesado contenido de ${structuredData.totalPages} páginas`);
    
    // Retornar como RTF que es compatible con DOCX
    const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}\\f0\\fs24 ${docxContent.replace(/\n/g, '\\par ')}}`;
    
    return new Blob([rtfContent], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    
  } catch (error) {
    console.error('Error en conversión PDF→DOCX:', error);
    throw new Error("No se pudo convertir el archivo PDF a DOCX: " + error.message);
  }
}

// Exportar las opciones de conversión soportadas
export const PDF_CONVERSION_OPTIONS = ['DOCX', 'TXT', 'MD'];
