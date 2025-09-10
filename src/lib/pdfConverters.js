// pdfConverters.js
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';

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
    let currentLine = [];
    let lastY;
    for (const item of content.items) {
      const itemY = item.transform[5];
      if (lastY !== undefined && Math.abs(itemY - lastY) > 5) {
        if (currentLine.length > 0) {
          pageLines.push(currentLine.join(' '));
          currentLine = [];
        }
      }
      currentLine.push(item.str);
      lastY = itemY;
    }
    if (currentLine.length > 0) {
      pageLines.push(currentLine.join(' '));
    }
    structuredContent.push({ lines: pageLines });
  }
  return structuredContent;
}

// Convierte PDF estructurado a TXT
export function pdfToTxt(pdfContent) {
  let textContent = '';
  for (const page of pdfContent) {
    textContent += page.lines.join('\n');
    textContent += '\n\n';
  }
  return new Blob([textContent.trim()], { type: 'text/plain' });
}

// Convierte PDF estructurado a DOCX
export async function pdfToDocx(pdfContent) {
  const docElements = [];
  for (const page of pdfContent) {
    for (const line of page.lines) {
      if (line.trim()) {
        docElements.push(new Paragraph({ children: [new TextRun(line.trim())] }));
      }
    }
  }
  const document = new Document({ sections: [{ children: docElements }] });
  const blob = await Packer.toBlob(document);
  return blob;
}

// Convierte PDF estructurado a Markdown
export function pdfToMarkdown(pdfContent) {
  let md = '';
  for (const page of pdfContent) {
    for (const line of page.lines) {
      if (line.trim()) {
        md += line.trim() + '\n\n';
      }
    }
  }
  return new Blob([md], { type: 'text/markdown' });
}

export const PDF_CONVERSION_OPTIONS = ['DOCX', 'TXT', 'MD'];
