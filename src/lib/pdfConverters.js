// pdfConverters.js
// Centraliza toda la lógica de conversión desde PDF a otros formatos coherentes

import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import { Document, Packer, Paragraph, HeadingLevel, TextRun, PageBreak, AlignmentType } from 'docx';

// Inicializa PDF.js worker usando el archivo local en /public
let pdfWorkerInitialized = false;
export function initPDFJS() {
  if (!pdfWorkerInitialized) {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      pdfWorkerInitialized = true;
      return true;
    } catch (error) {
      return false;
    }
  }
  return true;
}

// Extrae texto estructurado de un PDF
export async function extractTextFromPDF(file) {
  initPDFJS();
  const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const structuredContent = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    let pageLines = [];
    let styledLines = [];
    let currentLine = [];
    let currentStyledLine = [];
    let lastY;
    for (const item of content.items) {
      const itemY = item.transform[5];
      // Detectar salto de línea
      if (lastY !== undefined && Math.abs(itemY - lastY) > 5) {
        if (currentLine.length > 0) {
          pageLines.push(currentLine.join(' '));
          styledLines.push(currentStyledLine);
          currentLine = [];
          currentStyledLine = [];
        }
      }
      currentLine.push(item.str);
      // Extraer estilos con mapeo robusto
      const fontName = item.fontName ? item.fontName.toLowerCase() : '';
      const bold = /bold|black|heavy|demi|extrabold|semibold|medium|700|800|900/.test(fontName);
      const italic = /italic|oblique|slanted/.test(fontName);
      const style = {
        text: item.str,
        bold,
        italic,
        fontSize: item.transform ? Math.round(item.transform[0]) : 12,
        fontName: item.fontName || '',
      };
      currentStyledLine.push(style);
      lastY = itemY;
    }
    if (currentLine.length > 0) {
      pageLines.push(currentLine.join(' '));
      styledLines.push(currentStyledLine);
    }
    structuredContent.push({ pageNum: i, lines: pageLines, styledLines });
  }
  return structuredContent;
}

// Convierte PDF estructurado a DOCX
export async function pdfToDocx(pdfContent) {
  const docElements = [
    new Paragraph({ text: 'Documento Convertido', heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER })
  ];
  for (let i = 0; i < pdfContent.length; i++) {
    const page = pdfContent[i];
    docElements.push(new Paragraph({ text: `Página ${page.pageNum}`, heading: HeadingLevel.HEADING_2, alignment: AlignmentType.CENTER }));
    // Usar styledLines para preservar estilos
    for (const styledLine of page.styledLines) {
      if (styledLine.length > 0) {
        const runs = styledLine.map((item) => new TextRun({
          text: item.text,
          bold: item.bold,
          italics: item.italic,
          size: item.fontSize * 2, // docx usa la mitad de pt
          font: item.fontName,
        }));
        docElements.push(new Paragraph({ children: runs }));
      }
    }
    if (i < pdfContent.length - 1) {
      docElements.push(new Paragraph({ children: [new PageBreak()] }));
    }
  }
  const doc = new Document({ sections: [{ properties: {}, children: docElements }] });
  return await Packer.toBlob(doc);
}

// Convierte PDF estructurado a Markdown
export function pdfToMarkdown(pdfContent) {
  let md = '# Documento Convertido\n\n';
  for (let i = 0; i < pdfContent.length; i++) {
    const page = pdfContent[i];
    md += `## Página ${page.pageNum}\n\n`;
    for (const line of page.lines) {
      if (line.trim()) {
        md += line.trim() + '\n\n';
      }
    }
    if (i < pdfContent.length - 1) {
      md += '---\n\n';
    }
  }
  return new Blob([md], { type: 'text/markdown' });
}

// Convierte PDF estructurado a TXT
export function pdfToTxt(pdfContent) {
  let textContent = '';
  for (const page of pdfContent) {
    textContent += `=== Página ${page.pageNum} ===\n\n`;
    textContent += page.lines.join('\n');
    textContent += '\n\n';
  }
  return new Blob([textContent], { type: 'text/plain' });
}
