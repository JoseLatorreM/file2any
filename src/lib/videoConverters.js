import GIF from 'gif.js';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

let ffmpeg = null;

export const loadFFmpeg = async () => {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();
  
  // Usar CDN para cargar los archivos del core de FFmpeg
  // Esto evita tener que configurar manualmente los archivos en public/
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  
  try {
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
  } catch (error) {
    console.error("Error loading FFmpeg:", error);
    throw new Error("No se pudo cargar el motor de conversión de video. Asegúrate de que tu navegador soporte SharedArrayBuffer y que el sitio tenga los encabezados de seguridad correctos (Cross-Origin-Opener-Policy y Cross-Origin-Embedder-Policy).");
  }

  return ffmpeg;
};

export const VIDEO_CONVERSION_OPTIONS = {
  'mp4': ['MP3']
};

export const getVideoType = (file) => {
  const extension = file.name.split('.').pop().toLowerCase();
  if (extension === 'mp4') return 'mp4';
  return null;
};

export const convertVideoToGif = async (file, startTime, duration, qualityPreset = 'medium', onProgress) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.crossOrigin = "anonymous";
    
    // Configuración de calidad según preset
    let fps, width, quality;
    
    switch (qualityPreset) {
      case 'original':
        fps = 24; // Más fluido
        width = 640; // Un poco más grande
        quality = 1; // Máxima calidad de muestreo de color
        break;
      case 'performance':
        fps = 10;
        width = 320;
        quality = 20; // Menor calidad, más rápido
        break;
      case 'medium':
      default:
        fps = 15;
        width = 480;
        quality = 10; // Balanceado
        break;
    }
    
    const canvas = document.createElement('canvas');
    // willReadFrequently: true optimiza la lectura de píxeles en navegadores modernos
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
    // IMPORTANTE: Filtro para corregir colores pálidos en GIFs
    // Aumentamos saturación y contraste antes de generar la paleta de 256 colores
    ctx.filter = 'saturate(1.3) contrast(1.1) brightness(1.02)';
    
    const gif = new GIF({
      workers: Math.max(2, (navigator.hardwareConcurrency || 4) - 1), // Usar casi todos los núcleos para máxima velocidad
      quality: quality,
      width: width,
      height: width * (9/16), 
      workerScript: '/gif.worker.js'
    });

    video.onloadedmetadata = async () => {
      const aspectRatio = video.videoHeight / video.videoWidth;
      const height = Math.round(width * aspectRatio);
      
      canvas.width = width;
      canvas.height = height;
      gif.options.height = height;

      const totalFrames = Math.floor(duration * fps);
      let currentFrame = 0;
      
      // Función para capturar frame
      const captureFrame = async () => {
        if (currentFrame >= totalFrames) {
          // Finalizar
          gif.render();
          return;
        }

        const time = startTime + (currentFrame / fps);
        video.currentTime = time;
      };

      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, width, height);
        gif.addFrame(ctx, {copy: true, delay: 1000 / fps});
        
        currentFrame++;
        if (onProgress) {
          onProgress((currentFrame / totalFrames) * 0.8 * 100); // 80% captura, 20% render
        }
        captureFrame();
      };

      // Iniciar captura
      captureFrame();
    };

    video.onerror = (e) => {
      reject(new Error("Error al cargar el video para procesamiento."));
    };

    gif.on('finished', (blob) => {
      if (onProgress) onProgress(100);
      URL.revokeObjectURL(video.src);
      resolve(blob);
    });
    
    gif.on('progress', (p) => {
      // El progreso de renderizado va de 0 a 1
      if (onProgress) {
        onProgress(80 + (p * 20)); // Mapear al último 20%
      }
    });
  });
};

export const convertVideoToMp3 = async (file, onProgress) => {
  const ffmpeg = await loadFFmpeg();
  
  const inputName = 'input.mp4';
  const outputName = 'output.mp3';
  
  await ffmpeg.writeFile(inputName, await fetchFile(file));
  
  ffmpeg.on('progress', ({ progress }) => {
    if (onProgress) onProgress(progress * 100);
  });

  await ffmpeg.exec([
    '-i', inputName,
    '-vn', // No video
    '-acodec', 'libmp3lame',
    '-q:a', '2', // Alta calidad
    outputName
  ]);
  
  const data = await ffmpeg.readFile(outputName);
  return new Blob([data.buffer], { type: 'audio/mpeg' });
};
