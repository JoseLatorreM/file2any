import * as pdfjsLib from 'pdfjs-dist';

// Configurar el worker localmente para evitar problemas con CDNs externos (Hostinger, etc.)
export function setupPdfWorker() {
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    // Usamos extensión .js para evitar problemas de MIME type con .mjs en algunos servidores
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  }
}
