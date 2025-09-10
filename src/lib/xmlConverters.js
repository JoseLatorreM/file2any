// xmlConverters.js
import * as XLSX from 'xlsx';

// XML → JSON (manual, sin dependencias incompatibles)
export async function xmlToJson(file) {
  const text = await file.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, 'application/xml');
  const records = Array.from(xmlDoc.getElementsByTagName('record'));
  const json = records.map(record => {
    const obj = {};
    Array.from(record.children).forEach(child => {
      obj[child.tagName] = child.textContent;
    });
    return obj;
  });
  return new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
}

// XML → XLSX
export async function xmlToXlsx(file) {
  const text = await file.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, 'application/xml');
  const records = Array.from(xmlDoc.getElementsByTagName('record'));
  const json = records.map(record => {
    const obj = {};
    Array.from(record.children).forEach(child => {
      obj[child.tagName] = child.textContent;
    });
    return obj;
  });
  const worksheet = XLSX.utils.json_to_sheet(json);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  const xlsxArray = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([xlsxArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// XML → CSV
export async function xmlToCsv(file) {
  const text = await file.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, 'application/xml');
  const records = Array.from(xmlDoc.getElementsByTagName('record'));
  const json = records.map(record => {
    const obj = {};
    Array.from(record.children).forEach(child => {
      obj[child.tagName] = child.textContent;
    });
    return obj;
  });
  const worksheet = XLSX.utils.json_to_sheet(json);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  return new Blob([csv], { type: 'text/csv' });
}

export const XML_CONVERSION_OPTIONS = ['CSV', 'XLSX', 'JSON'];
