
// pptxConverters.js
// Conversiones limpias PPTX → PDF, PNG/JPG (diapositivas), TXT
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { parseStringPromise } from 'xml2js';

// Extrae el texto de todas las diapositivas de un archivo PPTX
export async function pptxToTxt(file) {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  let allText = '';
  const slideFiles = Object.keys(zip.files).filter(f => f.match(/^ppt\/slides\/slide[0-9]+.xml$/));
  for (const slideFile of slideFiles) {
    const xml = await zip.files[slideFile].async('string');
    const slide = await parseStringPromise(xml);
    // Extraer todos los textos
    const textRuns = [];
    function extractText(obj) {
      if (typeof obj === 'object') {
        for (const key in obj) {
          if (key === 'a:t' && Array.isArray(obj[key])) {
            textRuns.push(obj[key].join(' '));
          } else {
            extractText(obj[key]);
          }
        }
      }
    }
    extractText(slide);
    if (textRuns.length > 0) {
      allText += textRuns.join('\n') + '\n\n';
    }
  }
  return new Blob([allText.trim()], { type: 'text/plain' });
}

// PPTX → PDF (cada diapositiva como página, solo texto)
export async function pptxToPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const slideFiles = Object.keys(zip.files).filter(f => f.match(/^ppt\/slides\/slide[0-9]+.xml$/));
  let isFirst = true;
  for (const slideFile of slideFiles) {
    if (!isFirst) pdf.addPage();
    isFirst = false;
    const xml = await zip.files[slideFile].async('string');
    const slide = await parseStringPromise(xml);
    const textRuns = [];
    function extractText(obj) {
      if (typeof obj === 'object') {
        for (const key in obj) {
          if (key === 'a:t' && Array.isArray(obj[key])) {
            textRuns.push(obj[key].join(' '));
          } else {
            extractText(obj[key]);
          }
        }
      }
    }
    extractText(slide);
    let y = 30;
    pdf.setFontSize(14);
    for (const line of textRuns) {
      if (line.trim()) {
        pdf.text(line.trim(), 20, y);
        y += 10;
      }
    }
  }
  return pdf.output('blob');
}

// PPTX → Imágenes (PNG/JPG) de cada diapositiva (solo texto)
export async function pptxToImages(file, format = 'png') {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const slideFiles = Object.keys(zip.files).filter(f => f.match(/^ppt\/slides\/slide[0-9]+.xml$/));
  const blobs = [];
  for (const slideFile of slideFiles) {
    const xml = await zip.files[slideFile].async('string');
    const slide = await parseStringPromise(xml);
    const textRuns = [];
    function extractText(obj) {
      if (typeof obj === 'object') {
        for (const key in obj) {
          if (key === 'a:t' && Array.isArray(obj[key])) {
            textRuns.push(obj[key].join(' '));
          } else {
            extractText(obj[key]);
          }
        }
      }
    }
    extractText(slide);
    // Renderizar texto en canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '24px Arial';
    ctx.fillStyle = '#222';
    let y = 60;
    for (const line of textRuns) {
      if (line.trim()) {
        ctx.fillText(line.trim(), 60, y);
        y += 40;
      }
    }
    // Convertir canvas a imagen
    const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const dataUrl = canvas.toDataURL(mime);
    const byteString = atob(dataUrl.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    blobs.push(new Blob([ab], { type: mime }));
  }
  return blobs;
}

export const PPTX_CONVERSION_OPTIONS = ['PDF', 'PNG', 'JPG', 'TXT'];
