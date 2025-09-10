// jsonConverters.js
import * as XLSX from 'xlsx';

// JSON → CSV
export async function jsonToCsv(file) {
  const text = await file.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('El archivo JSON no es válido.');
  }
  const worksheet = XLSX.utils.json_to_sheet(json);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  return new Blob([csv], { type: 'text/csv' });
}

// JSON → XLSX
export async function jsonToXlsx(file) {
  const text = await file.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('El archivo JSON no es válido.');
  }
  const worksheet = XLSX.utils.json_to_sheet(json);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  const xlsxArray = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([xlsxArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// JSON → XML (manual, sin dependencias)
export async function jsonToXml(file) {
  const text = await file.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('El archivo JSON no es válido.');
  }
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<data>\n';
  (Array.isArray(json) ? json : [json]).forEach(row => {
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

export const JSON_CONVERSION_OPTIONS = ['CSV', 'XLSX', 'XML'];
