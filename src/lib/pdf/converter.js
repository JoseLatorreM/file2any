import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, TabStopType, TabStopPosition } from 'docx';
import { setupPdfWorker } from './setup';

// Asegurar que el worker esté configurado
setupPdfWorker();

/**
 * Convierte PDF a imágenes (PNG/JPG)
 * @param {File} file - Archivo PDF
 * @param {string} format - 'png' o 'jpg'
 * @returns {Promise<Blob[]>} - Array de Blobs de imagen
 */
export async function pdfToImages(file, format = 'png') {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const images = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 }); // Alta calidad
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    await page.render({ canvasContext: context, viewport: viewport }).promise;
    
    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const dataUrl = canvas.toDataURL(mimeType);
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    images.push(blob);
  }
  
  return images;
}

/**
 * Extrae texto de un PDF
 * @param {File} file - Archivo PDF
 * @returns {Promise<Blob>} - Archivo TXT
 */
export async function pdfToText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += `--- Página ${i} ---\n\n${pageText}\n\n`;
  }
  
  return new Blob([fullText], { type: 'text/plain' });
}

/**
 * Convierte PDF a Markdown
 * @param {File} file - Archivo PDF
 * @returns {Promise<Blob>} - Archivo MD
 */
export async function pdfToMarkdown(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let markdown = '# Contenido del PDF\n\n';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    
    markdown += `## Página ${i}\n\n${pageText}\n\n---\n\n`;
  }
  
  return new Blob([markdown], { type: 'text/markdown' });
}

/**
 * Convierte PDF a DOCX intentando preservar líneas y estructura básica
 * @param {File} file - Archivo PDF
 * @returns {Promise<Blob>} - Archivo DOCX
 */
export async function pdfToDocx(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  
  const sectionsChildren = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    // 1. Ordenar items por posición Y (arriba a abajo) y luego X (izquierda a derecha)
    const items = textContent.items.sort((a, b) => {
      const yA = a.transform[5];
      const yB = b.transform[5];
      if (Math.abs(yA - yB) > 4) { // Tolerancia vertical
        return yB - yA; // Descendente
      }
      return a.transform[4] - b.transform[4]; // Ascendente
    });

    // 2. Agrupar items en líneas
    const lines = [];
    let currentLine = [];
    let lastY = null;

    items.forEach(item => {
      const y = item.transform[5];
      if (lastY === null || Math.abs(y - lastY) < 4) {
        currentLine.push(item);
      } else {
        lines.push(currentLine);
        currentLine = [item];
      }
      lastY = y;
    });
    if (currentLine.length > 0) lines.push(currentLine);

    // 3. Procesar líneas para reconstruir párrafos y estructura
    let currentParagraphLines = [];
    let lastLineY = null;
    let lastLineFontSize = null;
    
    const flushParagraph = () => {
        if (currentParagraphLines.length === 0) return;
        
        // Detectar encabezados basado en tamaño de fuente
        const firstItem = currentParagraphLines[0][0];
        const fontSize = Math.sqrt((firstItem.transform[0] * firstItem.transform[0]));
        
        let heading = undefined;
        if (fontSize > 18) heading = HeadingLevel.HEADING_1;
        else if (fontSize > 15) heading = HeadingLevel.HEADING_2;
        else if (fontSize > 13) heading = HeadingLevel.HEADING_3;

        const runs = [];
        currentParagraphLines.forEach((line, lineIndex) => {
            // Espacio entre líneas fusionadas
            if (lineIndex > 0) runs.push(new TextRun({ text: " " }));
            
            line.forEach((item, itemIndex) => {
                // Detectar espacios o tabs entre items de la misma línea
                if (itemIndex > 0) {
                    const prevItem = line[itemIndex - 1];
                    const prevWidth = prevItem.width || (prevItem.str.length * fontSize * 0.5); 
                    const gap = item.transform[4] - (prevItem.transform[4] + prevWidth);
                    
                    if (gap > 5) {
                        if (gap > 20) {
                             runs.push(new TextRun({ text: "\t" })); // Tab para espacios grandes
                        } else {
                             runs.push(new TextRun({ text: " " }));
                        }
                    }
                }
                
                runs.push(new TextRun({
                    text: item.str,
                    bold: item.fontName.toLowerCase().includes('bold') || item.fontName.includes('+b'),
                    size: Math.max(20, Math.round(fontSize * 2)), // Half-points
                }));
            });
        });

        sectionsChildren.push(new Paragraph({
            children: runs,
            heading: heading,
            spacing: { after: 120 }, // Espacio después del párrafo
        }));
        
        currentParagraphLines = [];
    };

    lines.forEach(line => {
        const lineY = line[0].transform[5];
        const firstItem = line[0];
        const fontSize = Math.sqrt((firstItem.transform[0] * firstItem.transform[0]));

        // Decidir si fusionar con la línea anterior
        let merge = false;
        if (currentParagraphLines.length > 0) {
            const yDiff = Math.abs(lastLineY - lineY);
            // Si la distancia es razonable para ser la misma sección de texto (ej. 1.5x tamaño fuente)
            // Y el tamaño de fuente es similar
            if (yDiff < fontSize * 1.8 && Math.abs(fontSize - lastLineFontSize) < 2) {
                merge = true;
            }
        }

        if (!merge) {
            flushParagraph();
        }
        
        currentParagraphLines.push(line);
        lastLineY = lineY;
        lastLineFontSize = fontSize;
    });
    flushParagraph(); // Flush final

    // Salto de página (excepto última)
    if (i < pdf.numPages) {
       sectionsChildren.push(new Paragraph({ children: [], pageBreakBefore: true }));
    }
  }
  
  const doc = new Document({
    sections: [{
      properties: {},
      children: sectionsChildren,
    }],
  });
  
  return await Packer.toBlob(doc);
}

export const PDF_CONVERSION_OPTIONS = ['DOCX', 'TXT', 'MD', 'PNG', 'JPG'];
