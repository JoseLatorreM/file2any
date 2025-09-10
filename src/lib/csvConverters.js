// csvConverters.js
// Conversiones limpias CSV → XLSX, PDF, JSON, XML
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

// CSV → XLSX
export async function csvToXlsx(file) {
  const text = await file.text();
  const workbook = XLSX.read(text, { type: 'string', raw: false });
  const xlsxArray = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([xlsxArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// CSV → JSON
export async function csvToJson(file) {
  const text = await file.text();
  const workbook = XLSX.read(text, { type: 'string', raw: false });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(worksheet, { defval: null });
  return new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
}

// CSV → XML (manual, sin dependencias)
export async function csvToXml(file) {
  const text = await file.text();
  const workbook = XLSX.read(text, { type: 'string', raw: false });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<data>\n';
  json.forEach(row => {
    xml += '  <record>\n';
    Object.entries(row).forEach(([key, value]) => {
      xml += `    <${sanitizeTagName(key)}>${escapeXml(value)}</${sanitizeTagName(key)}>\n`;
    });
    xml += '  </record>\n';
  });
  xml += '</data>';
  return new Blob([xml], { type: 'application/xml' });
}

function escapeXml(text) {
  if (typeof text !== 'string') text = String(text);
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function sanitizeTagName(name) {
  if (typeof name !== 'string') name = String(name);
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/^[^a-zA-Z_]/, '_');
}

// CSV → PDF
export async function csvToPdf(file) {
  const text = await file.text();
  const workbook = XLSX.read(text, { type: 'string', raw: false });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(12);
  let y = 20;
  rows.forEach(row => {
    let x = 20;
    row.forEach(cell => {
      pdf.text(String(cell), x, y);
      x += 50;
    });
    y += 10;
    if (y > pdf.internal.pageSize.getHeight() - 20) {
      pdf.addPage();
      y = 20;
    }
  });
  return pdf.output('blob');
}

export const CSV_CONVERSION_OPTIONS = ['XLSX', 'PDF', 'JSON', 'XML'];
