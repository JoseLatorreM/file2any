// csvConverters.js
// Conversiones limpias CSV → XLSX, PDF, JSON, XML
import * as XLSX from 'xlsx';
import { PdfGenerator } from './pdf/generator';

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
  try {
    const text = await file.text();
    const workbook = XLSX.read(text, { type: 'string', raw: false });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Convertir a array de arrays para la tabla
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (!data || data.length === 0) {
      throw new Error("El archivo CSV está vacío");
    }

    const pdf = new PdfGenerator({
      orientation: 'landscape',
      format: 'a4'
    });

    // Asumimos que la primera fila son los encabezados
    const headers = data[0].map(h => String(h));
    const body = data.slice(1).map(row => row.map(cell => String(cell || '')));

    pdf.addHeading(file.name, 2);
    pdf.addTable(headers, body);

    return pdf.getBlob();
  } catch (error) {
    console.error('Error CSV->PDF:', error);
    throw new Error("No se pudo convertir CSV a PDF: " + error.message);
  }
}

export const CSV_CONVERSION_OPTIONS = ['XLSX', 'PDF', 'JSON', 'XML'];
