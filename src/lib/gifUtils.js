import { parseGIF, decompressFrames } from 'gifuct-js';

/**
 * Extrae frames de un GIF usando una implementación pura en JS (gifuct-js).
 * Esto evita la necesidad de cargar FFmpeg (WASM), siendo mucho más ligero y rápido para esta tarea.
 */
export const extractGifFrames = async (file, outputFormat = 'png', fps = 'original', onProgress) => {
  try {
    if (onProgress) onProgress('Leyendo archivo GIF...');
    
    const buffer = await file.arrayBuffer();
    const gif = parseGIF(buffer);
    const frames = decompressFrames(gif, true); // true = build patch

    if (!frames || frames.length === 0) {
      throw new Error("No se pudieron extraer frames del GIF.");
    }

    if (onProgress) onProgress(`Decodificando ${frames.length} frames...`);

    // Crear un canvas temporal para dibujar los frames
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Configurar tamaño del canvas basado en el GIF
    const width = gif.lsd.width;
    const height = gif.lsd.height;
    canvas.width = width;
    canvas.height = height;

    // Array para guardar los resultados
    const extractedFrames = [];
    
    // Variables para control de FPS
    let currentTime = 0;
    let lastCapturedTime = -1;
    const targetInterval = (fps && fps !== 'original') ? (1000 / parseInt(fps)) : 0;

    // ImageData temporal
    let frameImageData = ctx.createImageData(width, height);

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      
      // Manejo de Disposal (Cómo limpiar el frame anterior)
      // 0: No especificado (usualmente superponer)
      // 1: No disponer (dejar el gráfico anterior)
      // 2: Restaurar a fondo (borrar el área del frame actual)
      // 3: Restaurar a previo (volver al estado antes de dibujar este frame)
      
      // Guardar estado previo si es necesario para disposal 3
      let previousState = null;
      if (frame.disposalType === 3) {
        previousState = ctx.getImageData(0, 0, width, height);
      }

      // Dibujar el frame actual
      drawPatch(ctx, frameImageData, frame, width, height);

      // Decidir si capturamos este frame basado en FPS
      let shouldCapture = false;
      if (fps === 'original') {
        shouldCapture = true;
      } else {
        // Si ha pasado suficiente tiempo desde la última captura
        if (lastCapturedTime === -1 || (currentTime - lastCapturedTime) >= targetInterval) {
          shouldCapture = true;
          lastCapturedTime = currentTime;
        }
      }

      if (shouldCapture) {
        // Solo notificar progreso cada 5 frames para no saturar
        if (onProgress && i % 5 === 0) onProgress(`Procesando frame ${i + 1}/${frames.length}...`);
        
        const blob = await canvasToBlob(canvas, outputFormat);
        const fileName = `frame_${String(extractedFrames.length + 1).padStart(4, '0')}.${outputFormat.toLowerCase()}`;
        
        extractedFrames.push({
          name: fileName,
          blob: blob,
          url: URL.createObjectURL(blob)
        });
      }

      // Actualizar tiempo
      currentTime += frame.delay;

      // Aplicar Disposal para el siguiente ciclo
      if (frame.disposalType === 2) {
        // Restaurar a fondo (transparente)
        ctx.clearRect(frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height);
      } else if (frame.disposalType === 3 && previousState) {
        // Restaurar a previo
        ctx.putImageData(previousState, 0, 0);
      }
      // Disposal 0 y 1 no hacen nada (se acumulan)
    }

    if (onProgress) onProgress('¡Extracción completada!');
    return extractedFrames;

  } catch (error) {
    console.error("Error en extractGifFrames (JS puro):", error);
    throw error;
  }
};

// Función auxiliar para dibujar los píxeles del patch en el canvas
const drawPatch = (ctx, frameImageData, frame, width, height) => {
  const dims = frame.dims;
  
  // Si el frame no tiene patch, no hay nada que dibujar
  if (!frame.patch || frame.patch.length === 0) return;

  // Crear ImageData para el patch
  const patchData = new ImageData(
    new Uint8ClampedArray(frame.patch), 
    dims.width, 
    dims.height
  );

  // Dibujar el patch en la posición correcta usando un canvas temporal
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = dims.width;
  tempCanvas.height = dims.height;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.putImageData(patchData, 0, 0);

  ctx.drawImage(tempCanvas, dims.left, dims.top);
};

const canvasToBlob = (canvas, format) => {
  return new Promise((resolve) => {
    let mimeType = 'image/png';
    if (format === 'JPG') mimeType = 'image/jpeg';
    if (format === 'BMP') mimeType = 'image/bmp'; 
    if (format === 'SVG') mimeType = 'image/png'; 

    canvas.toBlob(async (blob) => {
      if (format === 'SVG') {
        // Envolver PNG en SVG
        const base64 = await blobToBase64(blob);
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">
            <image href="${base64}" width="100%" height="100%" />
        </svg>`;
        resolve(new Blob([svgContent], { type: 'image/svg+xml' }));
      } else {
        resolve(blob);
      }
    }, mimeType, 0.9);
  });
};

const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
