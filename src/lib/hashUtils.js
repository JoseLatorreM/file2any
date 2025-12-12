import CryptoJS from 'crypto-js';

export const HASH_ALGORITHMS = [
  { value: 'SHA-256', label: 'SHA-256', description: 'Equilibrio ideal entre seguridad y rendimiento.' },
  { value: 'SHA-512', label: 'SHA-512', description: 'Máxima seguridad para datos críticos.' },
  { value: 'SHA3-256', label: 'SHA3-256', description: 'Algoritmo de la familia SHA-3 (Keccak).' },
  { value: 'SHA-1', label: 'SHA-1', description: 'Compatibilidad heredada con sistemas legados.' },
  { value: 'MD5', label: 'MD5', description: 'Útil para checksums rápidos (no usar para seguridad).' }
];

export const HASH_OUTPUT_FORMATS = [
  { value: 'hex', label: 'Hexadecimal', description: 'Representación legible en la mayoría de sistemas.' },
  { value: 'base64', label: 'Base64', description: 'Cadena compacta ideal para URLs o JSON.' }
];

const HASHER_MAP = {
  'SHA-1': (input) => CryptoJS.SHA1(input),
  'SHA-256': (input) => CryptoJS.SHA256(input),
  'SHA-512': (input) => CryptoJS.SHA512(input),
  'SHA3-256': (input) => CryptoJS.SHA3(input, { outputLength: 256 }),
  'MD5': (input) => CryptoJS.MD5(input)
};

const formatWordArray = (wordArray, format) => {
  if (format === 'base64') {
    return wordArray.toString(CryptoJS.enc.Base64);
  }
  return wordArray.toString(CryptoJS.enc.Hex);
};

export const hashText = (text, algorithm = 'SHA-256', format = 'hex') => {
  if (typeof text !== 'string') {
    throw new Error('El texto a convertir debe ser una cadena.');
  }
  const hasher = HASHER_MAP[algorithm];
  if (!hasher) {
    throw new Error(`Algoritmo no soportado: ${algorithm}`);
  }
  const wordArray = hasher(text);
  return formatWordArray(wordArray, format);
};

export const verifyHash = (text, targetHash, algorithm = 'SHA-256', format = 'hex') => {
  if (typeof targetHash !== 'string' || !targetHash.trim()) {
    throw new Error('Debes proporcionar un hash de referencia.');
  }
  const generated = hashText(text, algorithm, format);
  if (format === 'hex') {
    return generated.toLowerCase() === targetHash.trim().toLowerCase();
  }
  return generated === targetHash.trim();
};
