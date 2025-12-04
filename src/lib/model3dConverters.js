/**
 * Conversores de modelos 3D usando Three.js
 * Soporta: OBJ → STL, STL → OBJ, y más
 */

import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';

// Formatos soportados
export const MODEL_3D_FORMATS = {
  obj: {
    extension: 'obj',
    mimeType: 'model/obj',
    name: 'Wavefront OBJ',
    canImport: true,
    canExport: true
  },
  stl: {
    extension: 'stl',
    mimeType: 'model/stl',
    name: 'Stereolithography',
    canImport: true,
    canExport: true
  }
};

// Opciones de conversión disponibles
export const MODEL_3D_CONVERSION_OPTIONS = {
  'obj': ['stl'],
  'stl': ['obj'],
  'model/obj': ['stl'],
  'application/x-tgif': ['stl'], // Algunos sistemas usan este MIME para OBJ
  'model/stl': ['obj'],
  'application/sla': ['obj'],
  'application/vnd.ms-pki.stl': ['obj']
};

/**
 * Detecta el tipo de modelo 3D
 */
export function getModel3DType(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  
  if (extension === 'obj') return 'obj';
  if (extension === 'stl') return 'stl';
  
  // Fallback por MIME type
  if (file.type.includes('obj')) return 'obj';
  if (file.type.includes('stl') || file.type.includes('sla')) return 'stl';
  
  return null;
}

/**
 * Verifica si es un archivo de modelo 3D soportado
 */
export function isModel3DFile(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  return ['obj', 'stl'].includes(extension);
}

/**
 * Obtiene las opciones de conversión para un archivo
 */
export function getModel3DConversionOptions(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  return MODEL_3D_CONVERSION_OPTIONS[extension] || MODEL_3D_CONVERSION_OPTIONS[file.type] || [];
}

/**
 * Carga un archivo OBJ y retorna un objeto Three.js
 */
async function loadOBJ(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const loader = new OBJLoader();
        const object = loader.parse(event.target.result);
        resolve(object);
      } catch (error) {
        reject(new Error(`Error parseando OBJ: ${error.message}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Error leyendo archivo OBJ'));
    reader.readAsText(file);
  });
}

/**
 * Carga un archivo STL y retorna una geometría Three.js
 */
async function loadSTL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const loader = new STLLoader();
        const geometry = loader.parse(event.target.result);
        
        // Crear mesh con material básico
        const material = new THREE.MeshStandardMaterial({ color: 0x808080 });
        const mesh = new THREE.Mesh(geometry, material);
        
        // Envolver en grupo para consistencia
        const group = new THREE.Group();
        group.add(mesh);
        
        resolve(group);
      } catch (error) {
        reject(new Error(`Error parseando STL: ${error.message}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Error leyendo archivo STL'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Exporta un objeto Three.js a formato STL
 */
function exportToSTL(object, binary = true) {
  const exporter = new STLExporter();
  
  if (binary) {
    // Exportar como binario (más compacto)
    const result = exporter.parse(object, { binary: true });
    return result; // ArrayBuffer
  } else {
    // Exportar como ASCII
    const result = exporter.parse(object, { binary: false });
    return result; // String
  }
}

/**
 * Exporta un objeto Three.js a formato OBJ
 */
function exportToOBJ(object) {
  const exporter = new OBJExporter();
  return exporter.parse(object); // String
}

/**
 * Convierte OBJ a STL
 * @param {File} file - Archivo OBJ
 * @param {Object} options - Opciones de conversión
 * @returns {Promise<Blob>} - Blob del archivo STL
 */
export async function objToStl(file, options = {}) {
  const { binary = true } = options;
  
  // Cargar OBJ
  const object = await loadOBJ(file);
  
  // Exportar a STL
  const stlData = exportToSTL(object, binary);
  
  // Crear Blob
  if (binary) {
    return new Blob([stlData], { type: 'model/stl' });
  } else {
    return new Blob([stlData], { type: 'text/plain' });
  }
}

/**
 * Convierte STL a OBJ
 * @param {File} file - Archivo STL
 * @param {Object} options - Opciones de conversión
 * @returns {Promise<Blob>} - Blob del archivo OBJ
 */
export async function stlToObj(file, options = {}) {
  // Cargar STL
  const object = await loadSTL(file);
  
  // Exportar a OBJ
  const objData = exportToOBJ(object);
  
  // Crear Blob
  return new Blob([objData], { type: 'model/obj' });
}

/**
 * Función principal de conversión de modelos 3D
 * @param {File} file - Archivo de entrada
 * @param {string} outputFormat - Formato de salida ('stl' o 'obj')
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Blob>} - Blob del archivo convertido
 */
export async function convertModel3D(file, outputFormat, options = {}) {
  const inputType = getModel3DType(file);
  
  if (!inputType) {
    throw new Error(`Formato de entrada no soportado: ${file.name}`);
  }
  
  const outputLower = outputFormat.toLowerCase();
  
  // Mapeo de conversiones
  const conversions = {
    'obj_to_stl': objToStl,
    'stl_to_obj': stlToObj,
  };
  
  const conversionKey = `${inputType}_to_${outputLower}`;
  const converter = conversions[conversionKey];
  
  if (!converter) {
    throw new Error(`Conversión no soportada: ${inputType} → ${outputLower}`);
  }
  
  return await converter(file, options);
}

/**
 * Obtiene estadísticas de un modelo 3D
 * @param {File} file - Archivo del modelo
 * @returns {Promise<Object>} - Estadísticas del modelo
 */
export async function getModel3DStats(file) {
  const type = getModel3DType(file);
  let object;
  
  if (type === 'obj') {
    object = await loadOBJ(file);
  } else if (type === 'stl') {
    object = await loadSTL(file);
  } else {
    throw new Error('Formato no soportado');
  }
  
  let totalVertices = 0;
  let totalFaces = 0;
  let meshCount = 0;
  
  object.traverse((child) => {
    if (child.isMesh) {
      meshCount++;
      const geometry = child.geometry;
      
      if (geometry.attributes.position) {
        totalVertices += geometry.attributes.position.count;
      }
      
      if (geometry.index) {
        totalFaces += geometry.index.count / 3;
      } else if (geometry.attributes.position) {
        totalFaces += geometry.attributes.position.count / 3;
      }
    }
  });
  
  return {
    type,
    meshCount,
    vertices: totalVertices,
    faces: Math.floor(totalFaces),
    fileSize: file.size,
    fileName: file.name
  };
}
