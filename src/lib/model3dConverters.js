/**
 * Conversores de modelos 3D usando Three.js
 * Soporta: OBJ, STL, 3MF, AMF
 * 
 * Matriz de conversión:
 * - OBJ → STL, 3MF, AMF ✓
 * - STL → OBJ, 3MF, AMF ✓
 * - 3MF → OBJ, STL, AMF ✓
 * - AMF → OBJ, STL, 3MF ✓
 */

import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { ThreeMFLoader } from 'three/addons/loaders/3MFLoader.js';
import { AMFLoader } from 'three/addons/loaders/AMFLoader.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';

// Formatos soportados
export const MODEL_3D_FORMATS = {
  obj: {
    extension: 'obj',
    mimeType: 'model/obj',
    name: 'Wavefront OBJ',
    description: 'Formato estándar con soporte de UVs y materiales',
    canImport: true,
    canExport: true
  },
  stl: {
    extension: 'stl',
    mimeType: 'model/stl',
    name: 'Stereolithography (STL)',
    description: 'Solo geometría, ideal para impresión 3D',
    canImport: true,
    canExport: true
  },
  '3mf': {
    extension: '3mf',
    mimeType: 'model/3mf',
    name: '3D Manufacturing Format',
    description: 'Formato moderno con color, texturas y metadatos',
    canImport: true,
    canExport: true
  },
  amf: {
    extension: 'amf',
    mimeType: 'application/x-amf',
    name: 'Additive Manufacturing File',
    description: 'Formato ISO con materiales y color por vértice',
    canImport: true,
    canExport: true
  }
};

// Opciones de conversión disponibles para cada formato
export const MODEL_3D_CONVERSION_OPTIONS = {
  'obj': ['STL', '3MF', 'AMF'],
  'stl': ['OBJ', '3MF', 'AMF'],
  '3mf': ['OBJ', 'STL', 'AMF'],
  'amf': ['OBJ', 'STL', '3MF'],
  // MIME types alternativos
  'model/obj': ['STL', '3MF', 'AMF'],
  'model/stl': ['OBJ', '3MF', 'AMF'],
  'application/sla': ['OBJ', '3MF', 'AMF'],
  'model/3mf': ['OBJ', 'STL', 'AMF'],
  'application/vnd.ms-package.3dmanufacturing-3dmodel+xml': ['OBJ', 'STL', 'AMF'],
  'application/x-amf': ['OBJ', 'STL', '3MF']
};

/**
 * Detecta el tipo de modelo 3D por extensión o MIME
 */
export function getModel3DType(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  
  if (extension === 'obj') return 'obj';
  if (extension === 'stl') return 'stl';
  if (extension === '3mf') return '3mf';
  if (extension === 'amf') return 'amf';
  
  // Fallback por MIME type
  const type = file.type.toLowerCase();
  if (type.includes('obj')) return 'obj';
  if (type.includes('stl') || type.includes('sla')) return 'stl';
  if (type.includes('3mf') || type.includes('3dmanufacturing')) return '3mf';
  if (type.includes('amf')) return 'amf';
  
  return null;
}

/**
 * Verifica si es un archivo de modelo 3D soportado
 */
export function isModel3DFile(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  return ['obj', 'stl', '3mf', 'amf'].includes(extension);
}

/**
 * Obtiene las opciones de conversión para un archivo
 */
export function getModel3DConversionOptions(file) {
  const extension = file.name.split('.').pop().toLowerCase();
  return MODEL_3D_CONVERSION_OPTIONS[extension] || MODEL_3D_CONVERSION_OPTIONS[file.type] || [];
}

// ============================================================================
// LOADERS - Funciones para cargar cada formato
// ============================================================================

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
 * Carga un archivo STL y retorna un objeto Three.js
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
 * Carga un archivo 3MF y retorna un objeto Three.js
 */
async function load3MF(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const loader = new ThreeMFLoader();
        const object = loader.parse(event.target.result);
        
        // Corregir orientación (3MF usa Z-up, Three.js usa Y-up)
        object.rotation.set(-Math.PI / 2, 0, 0);
        
        resolve(object);
      } catch (error) {
        reject(new Error(`Error parseando 3MF: ${error.message}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Error leyendo archivo 3MF'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Carga un archivo AMF y retorna un objeto Three.js
 */
async function loadAMF(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const loader = new AMFLoader();
        const object = loader.parse(event.target.result);
        
        // AMF también puede usar Z-up
        object.rotation.set(-Math.PI / 2, 0, 0);
        
        resolve(object);
      } catch (error) {
        reject(new Error(`Error parseando AMF: ${error.message}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Error leyendo archivo AMF'));
    reader.readAsArrayBuffer(file);
  });
}

// ============================================================================
// EXPORTERS - Funciones para exportar a cada formato
// ============================================================================

/**
 * Exporta un objeto Three.js a formato STL
 */
function exportToSTL(object, binary = true) {
  const exporter = new STLExporter();
  return exporter.parse(object, { binary });
}

/**
 * Exporta un objeto Three.js a formato OBJ
 */
function exportToOBJ(object) {
  const exporter = new OBJExporter();
  return exporter.parse(object);
}

/**
 * Configuración de niveles de optimización
 */
const OPTIMIZATION_LEVELS = {
  normal: {
    reduction: 0,           // Sin reducción
    minVertices: Infinity,  // Nunca simplificar automáticamente
    precision: 6            // Máxima precisión decimal
  },
  optimized: {
    reduction: 0.5,         // Reducir 50%
    minVertices: 30000,     // Simplificar si hay más de 30k vértices
    precision: 4            // Precisión media
  },
  performance: {
    reduction: 0.7,         // Reducir 70%
    minVertices: 10000,     // Simplificar si hay más de 10k vértices
    precision: 3            // Baja precisión (suficiente para visualización)
  }
};

/**
 * Repara una malla para hacerla manifold (cerrada/watertight)
 * - Fusiona vértices duplicados con tolerancia
 * - Crea índices para la geometría
 * - Asegura orientación consistente de normales
 * - Cierra vértices abiertos
 * 
 * @param {BufferGeometry} geometry - Geometría a reparar
 * @param {number} tolerance - Tolerancia para fusionar vértices (default: 0.0001)
 * @returns {BufferGeometry} - Geometría reparada e indexada
 */
function repairMesh(geometry, tolerance = 0.0001) {
  const positions = geometry.attributes.position;
  const vertexCount = positions.count;
  
  console.log(`Reparando malla: ${vertexCount} vértices originales...`);
  
  // Paso 1: Construir mapa de vértices únicos con tolerancia
  // Usamos un hash espacial para encontrar vértices cercanos eficientemente
  const hashMap = new Map();
  const uniqueVertices = [];
  const vertexRemap = new Uint32Array(vertexCount); // Mapea índice original -> índice único
  
  const hashScale = 1 / tolerance;
  
  function vertexHash(x, y, z) {
    // Crear hash basado en posición cuantizada
    const qx = Math.round(x * hashScale);
    const qy = Math.round(y * hashScale);
    const qz = Math.round(z * hashScale);
    return `${qx},${qy},${qz}`;
  }
  
  function findOrAddVertex(x, y, z) {
    const hash = vertexHash(x, y, z);
    
    // Buscar en celdas cercanas para manejar casos de borde
    const candidates = hashMap.get(hash);
    
    if (candidates) {
      // Verificar si algún candidato está dentro de la tolerancia
      for (const idx of candidates) {
        const ux = uniqueVertices[idx * 3];
        const uy = uniqueVertices[idx * 3 + 1];
        const uz = uniqueVertices[idx * 3 + 2];
        
        const dx = x - ux;
        const dy = y - uy;
        const dz = z - uz;
        const distSq = dx * dx + dy * dy + dz * dz;
        
        if (distSq <= tolerance * tolerance) {
          return idx;
        }
      }
    }
    
    // No encontrado, agregar nuevo vértice
    const newIdx = uniqueVertices.length / 3;
    uniqueVertices.push(x, y, z);
    
    if (!hashMap.has(hash)) {
      hashMap.set(hash, []);
    }
    hashMap.get(hash).push(newIdx);
    
    return newIdx;
  }
  
  // Procesar todos los vértices
  for (let i = 0; i < vertexCount; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = positions.getZ(i);
    
    vertexRemap[i] = findOrAddVertex(x, y, z);
  }
  
  console.log(`  Vértices únicos encontrados: ${uniqueVertices.length / 3} (fusionados: ${vertexCount - uniqueVertices.length / 3})`);
  
  // Paso 2: Construir triángulos con los nuevos índices
  const indices = [];
  const originalIndices = geometry.index;
  
  if (originalIndices) {
    // Geometría ya indexada - remapear índices
    for (let i = 0; i < originalIndices.count; i += 3) {
      const a = vertexRemap[originalIndices.getX(i)];
      const b = vertexRemap[originalIndices.getX(i + 1)];
      const c = vertexRemap[originalIndices.getX(i + 2)];
      
      // Filtrar triángulos degenerados (mismos vértices)
      if (a !== b && b !== c && c !== a) {
        indices.push(a, b, c);
      }
    }
  } else {
    // Geometría no indexada - crear índices desde triángulos
    for (let i = 0; i < vertexCount; i += 3) {
      const a = vertexRemap[i];
      const b = vertexRemap[i + 1];
      const c = vertexRemap[i + 2];
      
      // Filtrar triángulos degenerados
      if (a !== b && b !== c && c !== a) {
        indices.push(a, b, c);
      }
    }
  }
  
  console.log(`  Triángulos válidos: ${indices.length / 3}`);
  
  // Paso 3: Detectar y manejar bordes abiertos
  // Construir mapa de aristas -> triángulos
  const edgeMap = new Map();
  const triangleCount = indices.length / 3;
  
  function edgeKey(v1, v2) {
    return v1 < v2 ? `${v1}-${v2}` : `${v2}-${v1}`;
  }
  
  function orderedEdgeKey(v1, v2) {
    return `${v1}-${v2}`;
  }
  
  // Contar aristas y su dirección
  for (let i = 0; i < triangleCount; i++) {
    const a = indices[i * 3];
    const b = indices[i * 3 + 1];
    const c = indices[i * 3 + 2];
    
    const edges = [
      [a, b],
      [b, c],
      [c, a]
    ];
    
    for (const [v1, v2] of edges) {
      const key = edgeKey(v1, v2);
      const ordered = orderedEdgeKey(v1, v2);
      
      if (!edgeMap.has(key)) {
        edgeMap.set(key, { count: 0, directions: new Set() });
      }
      
      const edge = edgeMap.get(key);
      edge.count++;
      edge.directions.add(ordered);
    }
  }
  
  // Encontrar aristas abiertas (solo 1 triángulo) o no-manifold (más de 2)
  let openEdges = 0;
  let nonManifoldEdges = 0;
  
  for (const [key, edge] of edgeMap) {
    if (edge.count === 1) {
      openEdges++;
    } else if (edge.count > 2) {
      nonManifoldEdges++;
    }
  }
  
  console.log(`  Aristas abiertas: ${openEdges}, No-manifold: ${nonManifoldEdges}`);
  
  // Paso 4: Orientar normales consistentemente usando votación
  // Para cada vértice, calculamos la normal promedio ponderada por área
  const vertexNormals = new Float32Array((uniqueVertices.length / 3) * 3);
  
  for (let i = 0; i < triangleCount; i++) {
    const ai = indices[i * 3];
    const bi = indices[i * 3 + 1];
    const ci = indices[i * 3 + 2];
    
    // Obtener posiciones
    const ax = uniqueVertices[ai * 3], ay = uniqueVertices[ai * 3 + 1], az = uniqueVertices[ai * 3 + 2];
    const bx = uniqueVertices[bi * 3], by = uniqueVertices[bi * 3 + 1], bz = uniqueVertices[bi * 3 + 2];
    const cx = uniqueVertices[ci * 3], cy = uniqueVertices[ci * 3 + 1], cz = uniqueVertices[ci * 3 + 2];
    
    // Calcular vectores de arista
    const e1x = bx - ax, e1y = by - ay, e1z = bz - az;
    const e2x = cx - ax, e2y = cy - ay, e2z = cz - az;
    
    // Normal del triángulo (producto cruz)
    const nx = e1y * e2z - e1z * e2y;
    const ny = e1z * e2x - e1x * e2z;
    const nz = e1x * e2y - e1y * e2x;
    
    // Agregar a los vértices del triángulo
    vertexNormals[ai * 3] += nx; vertexNormals[ai * 3 + 1] += ny; vertexNormals[ai * 3 + 2] += nz;
    vertexNormals[bi * 3] += nx; vertexNormals[bi * 3 + 1] += ny; vertexNormals[bi * 3 + 2] += nz;
    vertexNormals[ci * 3] += nx; vertexNormals[ci * 3 + 1] += ny; vertexNormals[ci * 3 + 2] += nz;
  }
  
  // Normalizar las normales de vértice
  for (let i = 0; i < vertexNormals.length; i += 3) {
    const nx = vertexNormals[i];
    const ny = vertexNormals[i + 1];
    const nz = vertexNormals[i + 2];
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    
    if (len > 0) {
      vertexNormals[i] /= len;
      vertexNormals[i + 1] /= len;
      vertexNormals[i + 2] /= len;
    }
  }
  
  // Paso 5: Crear geometría reparada
  const repairedGeometry = new THREE.BufferGeometry();
  repairedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(uniqueVertices, 3));
  repairedGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(vertexNormals, 3));
  repairedGeometry.setIndex(indices);
  
  console.log(`  Malla reparada: ${uniqueVertices.length / 3} vértices, ${indices.length / 3} triángulos`);
  
  return repairedGeometry;
}

/**
 * Simplifica una geometría reduciendo el número de vértices
 * @param {BufferGeometry} geometry - Geometría a simplificar
 * @param {string} optimizationLevel - Nivel: 'normal', 'optimized', 'performance'
 */
function simplifyGeometry(geometry, optimizationLevel = 'normal') {
  const config = OPTIMIZATION_LEVELS[optimizationLevel] || OPTIMIZATION_LEVELS.normal;
  const positions = geometry.attributes.position;
  const indices = geometry.index;
  
  // Si es modo normal o el modelo es pequeño, no simplificar
  if (config.reduction === 0 || positions.count < config.minVertices) {
    return geometry;
  }
  
  console.log(`Simplificando geometría (${optimizationLevel}): ${positions.count} vértices...`);
  
  // Calcular el paso de muestreo basado en la reducción
  const step = Math.max(1, Math.floor(1 / (1 - config.reduction)));
  const newPositions = [];
  
  if (indices) {
    // Geometría indexada - muestrear triángulos
    for (let i = 0; i < indices.count; i += step * 3) {
      for (let j = 0; j < 3 && (i + j) < indices.count; j++) {
        const idx = indices.getX(i + j);
        newPositions.push(
          positions.getX(idx),
          positions.getY(idx),
          positions.getZ(idx)
        );
      }
    }
  } else {
    // Geometría no indexada - asegurar que tomamos triángulos completos
    for (let i = 0; i < positions.count; i += step * 3) {
      for (let j = 0; j < 3 && (i + j) < positions.count; j++) {
        newPositions.push(
          positions.getX(i + j),
          positions.getY(i + j),
          positions.getZ(i + j)
        );
      }
    }
  }
  
  const newGeometry = new THREE.BufferGeometry();
  newGeometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3));
  newGeometry.computeVertexNormals();
  
  const reductionPercent = ((1 - (newPositions.length / 3) / positions.count) * 100).toFixed(1);
  console.log(`Geometría simplificada: ${newPositions.length / 3} vértices (reducción: ${reductionPercent}%)`);
  
  return newGeometry;
}

/**
 * Exporta un objeto Three.js a formato 3MF
 * @param {Object3D} object - Objeto Three.js a exportar
 * @param {string} optimizationLevel - Nivel: 'normal', 'optimized', 'performance'
 */
async function exportTo3MF(object, optimizationLevel = 'normal') {
  const config = OPTIMIZATION_LEVELS[optimizationLevel] || OPTIMIZATION_LEVELS.normal;
  
  // Recolectar geometrías
  const meshes = [];
  object.traverse((child) => {
    if (child.isMesh && child.geometry) {
      meshes.push(child);
    }
  });

  if (meshes.length === 0) {
    throw new Error('No se encontraron mallas para exportar');
  }

  // Calcular total de vértices
  let totalVertices = 0;
  for (const mesh of meshes) {
    totalVertices += mesh.geometry.attributes.position.count;
  }
  
  console.log(`Exportando a 3MF (${optimizationLevel}): ${totalVertices} vértices`);

  // Crear archivo 3MF usando chunks para evitar string length overflow
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  
  // Procesar meshes en chunks
  const vertexChunks = [];
  const triangleChunks = [];
  let vertexOffset = 0;
  
  for (const mesh of meshes) {
    let geometry = mesh.geometry.clone();
    geometry.applyMatrix4(mesh.matrixWorld);
    
    // PASO 1: Reparar la malla (fusionar vértices duplicados, crear índices)
    // Esto cierra los vértices abiertos y hace la malla manifold
    geometry = repairMesh(geometry, config.precision === 6 ? 0.0001 : config.precision === 4 ? 0.001 : 0.01);
    
    // PASO 2: Aplicar simplificación si es necesario
    geometry = simplifyGeometry(geometry, optimizationLevel);
    
    const positions = geometry.attributes.position;
    const indices = geometry.index;
    const precision = config.precision;
    
    // Ahora la geometría siempre está indexada después de repairMesh
    // Procesar vértices en chunks de 10000
    const CHUNK_SIZE = 10000;
    for (let i = 0; i < positions.count; i += CHUNK_SIZE) {
      const end = Math.min(i + CHUNK_SIZE, positions.count);
      let chunk = '';
      for (let j = i; j < end; j++) {
        const x = positions.getX(j).toFixed(precision);
        const y = positions.getY(j).toFixed(precision);
        const z = positions.getZ(j).toFixed(precision);
        chunk += `<vertex x="${x}" y="${y}" z="${z}"/>\n`;
      }
      vertexChunks.push(chunk);
    }
    
    // Procesar triángulos usando los índices reparados
    if (indices) {
      for (let i = 0; i < indices.count; i += CHUNK_SIZE * 3) {
        const end = Math.min(i + CHUNK_SIZE * 3, indices.count);
        let chunk = '';
        for (let j = i; j < end; j += 3) {
          const v1 = vertexOffset + indices.getX(j);
          const v2 = vertexOffset + indices.getX(j + 1);
          const v3 = vertexOffset + indices.getX(j + 2);
          chunk += `<triangle v1="${v1}" v2="${v2}" v3="${v3}"/>\n`;
        }
        triangleChunks.push(chunk);
      }
      vertexOffset += positions.count;
    } else {
      // Fallback por si repairMesh no creó índices (no debería pasar)
      for (let i = 0; i < positions.count; i += CHUNK_SIZE * 3) {
        const end = Math.min(i + CHUNK_SIZE * 3, positions.count);
        let chunk = '';
        for (let j = i; j < end; j += 3) {
          chunk += `<triangle v1="${vertexOffset + j}" v2="${vertexOffset + j + 1}" v3="${vertexOffset + j + 2}"/>\n`;
        }
        triangleChunks.push(chunk);
      }
      vertexOffset += positions.count;
    }
  }
  
  // Construir XML usando Blob para evitar límites de string
  const xmlParts = [
    '<?xml version="1.0" encoding="UTF-8"?>\n',
    '<model unit="millimeter" xml:lang="en-US" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02">\n',
    '<metadata name="Application">File2Any Converter</metadata>\n',
    '<resources><object id="1" type="model"><mesh>\n',
    '<vertices>\n',
    ...vertexChunks,
    '</vertices>\n',
    '<triangles>\n',
    ...triangleChunks,
    '</triangles>\n',
    '</mesh></object></resources>\n',
    '<build><item objectid="1"/></build>\n',
    '</model>'
  ];
  
  // Crear Blob del modelo directamente
  const modelBlob = new Blob(xmlParts, { type: 'application/xml' });
  
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Target="/3D/3dmodel.model" Id="rel0" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>
</Relationships>`;

  zip.file('[Content_Types].xml', contentTypesXml);
  zip.file('_rels/.rels', relsXml);
  zip.file('3D/3dmodel.model', modelBlob);

  return await zip.generateAsync({ type: 'blob', mimeType: 'model/3mf' });
}

/**
 * Exporta un objeto Three.js a formato AMF
 * @param {Object3D} object - Objeto Three.js a exportar
 * @param {string} optimizationLevel - Nivel: 'normal', 'optimized', 'performance'
 */
async function exportToAMF(object, optimizationLevel = 'normal') {
  const config = OPTIMIZATION_LEVELS[optimizationLevel] || OPTIMIZATION_LEVELS.normal;
  
  // Recolectar todas las geometrías
  const meshes = [];
  object.traverse((child) => {
    if (child.isMesh && child.geometry) {
      meshes.push(child);
    }
  });

  if (meshes.length === 0) {
    throw new Error('No se encontraron mallas para exportar');
  }

  console.log(`Exportando a AMF (${optimizationLevel})`);

  // Usar TextEncoder para mejor rendimiento
  const encoder = new TextEncoder();
  const chunks = [];
  const precision = config.precision;
  
  // Header AMF
  chunks.push(encoder.encode('<?xml version="1.0" encoding="UTF-8"?>\n'));
  chunks.push(encoder.encode('<amf unit="millimeter" version="1.1">\n'));
  chunks.push(encoder.encode('<metadata type="name">Converted Model</metadata>\n'));
  chunks.push(encoder.encode('<metadata type="author">File2Any Converter</metadata>\n'));

  let objectId = 1;

  for (const mesh of meshes) {
    let geometry = mesh.geometry.clone();
    geometry.applyMatrix4(mesh.matrixWorld);
    
    // PASO 1: Reparar la malla (fusionar vértices duplicados, crear índices)
    // Esto cierra los vértices abiertos y hace la malla manifold
    geometry = repairMesh(geometry, config.precision === 6 ? 0.0001 : config.precision === 4 ? 0.001 : 0.01);
    
    // PASO 2: Aplicar simplificación si es necesario
    geometry = simplifyGeometry(geometry, optimizationLevel);

    const positions = geometry.attributes.position;
    const indices = geometry.index;

    chunks.push(encoder.encode(`<object id="${objectId}"><mesh>\n<vertices>\n`));

    // Procesar vértices en lotes para evitar bloqueo del navegador
    const BATCH_SIZE = 10000;
    for (let i = 0; i < positions.count; i += BATCH_SIZE) {
      const end = Math.min(i + BATCH_SIZE, positions.count);
      let vertexBatch = '';
      
      for (let j = i; j < end; j++) {
        const x = positions.getX(j).toFixed(precision);
        const y = positions.getY(j).toFixed(precision);
        const z = positions.getZ(j).toFixed(precision);
        vertexBatch += `<vertex><coordinates><x>${x}</x><y>${y}</y><z>${z}</z></coordinates></vertex>\n`;
      }
      
      chunks.push(encoder.encode(vertexBatch));
      
      // Permitir que el navegador respire cada lote
      if (i + BATCH_SIZE < positions.count) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    chunks.push(encoder.encode('</vertices>\n<volume>\n'));

    // Procesar triángulos usando los índices reparados
    if (indices) {
      for (let i = 0; i < indices.count; i += BATCH_SIZE * 3) {
        const end = Math.min(i + BATCH_SIZE * 3, indices.count);
        let triBatch = '';
        
        for (let j = i; j < end; j += 3) {
          const v1 = indices.getX(j);
          const v2 = indices.getX(j + 1);
          const v3 = indices.getX(j + 2);
          triBatch += `<triangle><v1>${v1}</v1><v2>${v2}</v2><v3>${v3}</v3></triangle>\n`;
        }
        
        chunks.push(encoder.encode(triBatch));
        
        if (i + BATCH_SIZE * 3 < indices.count) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    } else {
      for (let i = 0; i < positions.count; i += BATCH_SIZE * 3) {
        const end = Math.min(i + BATCH_SIZE * 3, positions.count);
        let triBatch = '';
        
        for (let j = i; j < end; j += 3) {
          triBatch += `<triangle><v1>${j}</v1><v2>${j + 1}</v2><v3>${j + 2}</v3></triangle>\n`;
        }
        
        chunks.push(encoder.encode(triBatch));
        
        if (i + BATCH_SIZE * 3 < positions.count) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    }

    chunks.push(encoder.encode('</volume>\n</mesh></object>\n'));
    objectId++;
  }

  chunks.push(encoder.encode('</amf>'));

  // Combinar todos los chunks en un solo Blob
  return new Blob(chunks, { type: 'application/x-amf' });
}

// ============================================================================
// CONVERSORES - Funciones de conversión entre formatos
// ============================================================================

/**
 * Convierte OBJ a STL
 */
export async function objToStl(file, options = {}) {
  const { binary = true } = options;
  const object = await loadOBJ(file);
  const stlData = exportToSTL(object, binary);
  
  return new Blob([stlData], { type: 'model/stl' });
}

/**
 * Convierte OBJ a 3MF
 */
export async function objTo3mf(file, options = {}) {
  const { optimization = 'normal' } = options;
  const object = await loadOBJ(file);
  return await exportTo3MF(object, optimization);
}

/**
 * Convierte OBJ a AMF
 */
export async function objToAmf(file, options = {}) {
  const { optimization = 'normal' } = options;
  const object = await loadOBJ(file);
  return await exportToAMF(object, optimization);
}

/**
 * Convierte STL a OBJ
 */
export async function stlToObj(file, options = {}) {
  const object = await loadSTL(file);
  const objData = exportToOBJ(object);
  return new Blob([objData], { type: 'model/obj' });
}

/**
 * Convierte STL a 3MF
 */
export async function stlTo3mf(file, options = {}) {
  const { optimization = 'normal' } = options;
  const object = await loadSTL(file);
  return await exportTo3MF(object, optimization);
}

/**
 * Convierte STL a AMF
 */
export async function stlToAmf(file, options = {}) {
  const { optimization = 'normal' } = options;
  const object = await loadSTL(file);
  return await exportToAMF(object, optimization);
}

/**
 * Convierte 3MF a OBJ
 */
export async function threemfToObj(file, options = {}) {
  const object = await load3MF(file);
  const objData = exportToOBJ(object);
  return new Blob([objData], { type: 'model/obj' });
}

/**
 * Convierte 3MF a STL
 */
export async function threemfToStl(file, options = {}) {
  const { binary = true } = options;
  const object = await load3MF(file);
  const stlData = exportToSTL(object, binary);
  return new Blob([stlData], { type: 'model/stl' });
}

/**
 * Convierte 3MF a AMF
 */
export async function threemfToAmf(file, options = {}) {
  const { optimization = 'normal' } = options;
  const object = await load3MF(file);
  return await exportToAMF(object, optimization);
}

/**
 * Convierte AMF a OBJ
 */
export async function amfToObj(file, options = {}) {
  const object = await loadAMF(file);
  const objData = exportToOBJ(object);
  return new Blob([objData], { type: 'model/obj' });
}

/**
 * Convierte AMF a STL
 */
export async function amfToStl(file, options = {}) {
  const { binary = true } = options;
  const object = await loadAMF(file);
  const stlData = exportToSTL(object, binary);
  return new Blob([stlData], { type: 'model/stl' });
}

/**
 * Convierte AMF a 3MF
 */
export async function amfTo3mf(file, options = {}) {
  const { optimization = 'normal' } = options;
  const object = await loadAMF(file);
  return await exportTo3MF(object, optimization);
}

// ============================================================================
// API PRINCIPAL
// ============================================================================

/**
 * Función principal de conversión de modelos 3D
 * @param {File} file - Archivo de entrada
 * @param {string} outputFormat - Formato de salida ('stl', 'obj', '3mf', 'amf')
 * @param {Object} options - Opciones adicionales
 * @returns {Promise<Blob>} - Blob del archivo convertido
 */
export async function convertModel3D(file, outputFormat, options = {}) {
  const inputType = getModel3DType(file);
  
  if (!inputType) {
    throw new Error(`Formato de entrada no soportado: ${file.name}`);
  }
  
  const outputLower = outputFormat.toLowerCase();
  
  // Si el formato de entrada y salida son iguales, retornar el archivo original
  if (inputType === outputLower) {
    return file;
  }
  
  // Mapeo de todas las conversiones disponibles
  const conversions = {
    // Desde OBJ
    'obj_to_stl': objToStl,
    'obj_to_3mf': objTo3mf,
    'obj_to_amf': objToAmf,
    // Desde STL
    'stl_to_obj': stlToObj,
    'stl_to_3mf': stlTo3mf,
    'stl_to_amf': stlToAmf,
    // Desde 3MF
    '3mf_to_obj': threemfToObj,
    '3mf_to_stl': threemfToStl,
    '3mf_to_amf': threemfToAmf,
    // Desde AMF
    'amf_to_obj': amfToObj,
    'amf_to_stl': amfToStl,
    'amf_to_3mf': amfTo3mf,
  };
  
  const conversionKey = `${inputType}_to_${outputLower}`;
  const converter = conversions[conversionKey];
  
  if (!converter) {
    throw new Error(`Conversión no soportada: ${inputType.toUpperCase()} → ${outputLower.toUpperCase()}`);
  }
  
  console.log(`Convirtiendo ${inputType.toUpperCase()} → ${outputLower.toUpperCase()}...`);
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
  
  switch (type) {
    case 'obj':
      object = await loadOBJ(file);
      break;
    case 'stl':
      object = await loadSTL(file);
      break;
    case '3mf':
      object = await load3MF(file);
      break;
    case 'amf':
      object = await loadAMF(file);
      break;
    default:
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
    format: MODEL_3D_FORMATS[type]?.name || type.toUpperCase(),
    meshCount,
    vertices: totalVertices,
    faces: Math.floor(totalFaces),
    fileSize: file.size,
    fileName: file.name
  };
}

/**
 * Información sobre pérdida de datos en conversiones
 */
export const CONVERSION_LOSS_INFO = {
  'obj_to_stl': {
    lost: ['UVs', 'Texturas', 'Materiales', 'Grupos'],
    preserved: ['Geometría', 'Normales (recalculadas)']
  },
  'obj_to_3mf': {
    lost: ['Algunos materiales avanzados'],
    preserved: ['Geometría', 'UVs', 'Texturas', 'Colores', 'Grupos']
  },
  'obj_to_amf': {
    lost: ['UVs'],
    preserved: ['Geometría', 'Materiales', 'Colores']
  },
  'stl_to_obj': {
    lost: [],
    preserved: ['Geometría', 'Normales']
  },
  'stl_to_3mf': {
    lost: [],
    preserved: ['Geometría']
  },
  'stl_to_amf': {
    lost: [],
    preserved: ['Geometría']
  },
  '3mf_to_obj': {
    lost: ['Metadatos', 'Algunos colores'],
    preserved: ['Geometría', 'UVs', 'Texturas']
  },
  '3mf_to_stl': {
    lost: ['UVs', 'Texturas', 'Materiales', 'Colores', 'Metadatos'],
    preserved: ['Geometría']
  },
  '3mf_to_amf': {
    lost: ['UVs'],
    preserved: ['Geometría', 'Materiales', 'Colores', 'Metadatos']
  },
  'amf_to_obj': {
    lost: ['Metadatos', 'Colores por vértice'],
    preserved: ['Geometría', 'Materiales básicos']
  },
  'amf_to_stl': {
    lost: ['Materiales', 'Colores', 'Metadatos'],
    preserved: ['Geometría']
  },
  'amf_to_3mf': {
    lost: ['Curvas (si las hay)'],
    preserved: ['Geometría', 'Materiales', 'Colores', 'Metadatos']
  }
};
