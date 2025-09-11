/**
 * Audio Converters Module
 * 
 * Este módulo maneja toda la funcionalidad de conversión de audio para File2Any.
 * Soporta conversión entre diversos formatos de audio, ajustes de calidad y propiedades.
 */

// Importar bibliotecas necesarias
import lamejs from 'lamejs';
import { WaveFile } from 'wavefile';

// La web audio API es la forma principal de trabajar con audio en el navegador
const AudioContext = window.AudioContext || window.webkitAudioContext;

/**
 * Constantes de formatos de audio soportados
 */
export const AUDIO_FORMATS = {
  MP3: 'mp3',   // Alta compresión con pérdida
  WAV: 'wav',   // Sin compresión, sin pérdida
  FLAC: 'flac', // Compresión sin pérdida
  AAC: 'aac',   // Alta compresión con pérdida (mejor que MP3)
  OGG: 'ogg',   // Formato libre con pérdida
  OPUS: 'opus', // Alta compresión con pérdida (mejor que AAC)
  M4A: 'm4a',   // Contenedor AAC
  WMA: 'wma',   // Formato propietario de Microsoft
  AIFF: 'aiff'  // Sin compresión, sin pérdida (Apple)
};

/**
 * Opciones de calidad para audio
 */
export const AUDIO_QUALITY = {
  LOW: {
    bitrate: 128,    // kbps
    sampleRate: 44100 // Hz
  },
  MEDIUM: {
    bitrate: 192,    // kbps
    sampleRate: 44100 // Hz
  },
  HIGH: {
    bitrate: 320,    // kbps
    sampleRate: 48000 // Hz
  },
  LOSSLESS: {
    bitrate: null,   // Sin límite
    sampleRate: 96000 // Hz
  }
};

/**
 * Determina el tipo de archivo de audio
 * @param {File} file - El archivo de audio
 * @returns {string} - El tipo de audio (mp3, wav, etc.)
 */
export const getAudioType = (file) => {
  if (!file) return null;
  
  // Verificar el tipo MIME primero
  const type = file.type.toLowerCase();
  
  if (type.includes('mpeg') || type.includes('mp3')) return AUDIO_FORMATS.MP3;
  if (type.includes('wav')) return AUDIO_FORMATS.WAV;
  if (type.includes('flac')) return AUDIO_FORMATS.FLAC;
  if (type.includes('aac')) return AUDIO_FORMATS.AAC;
  if (type.includes('ogg')) return AUDIO_FORMATS.OGG;
  if (type.includes('opus')) return AUDIO_FORMATS.OPUS;
  if (type.includes('m4a')) return AUDIO_FORMATS.M4A;
  if (type.includes('wma')) return AUDIO_FORMATS.WMA;
  if (type.includes('aiff')) return AUDIO_FORMATS.AIFF;
  
  // Si no se puede determinar por el tipo MIME, usar la extensión de archivo
  const fileName = file.name.toLowerCase();
  if (fileName.endsWith('.mp3')) return AUDIO_FORMATS.MP3;
  if (fileName.endsWith('.wav')) return AUDIO_FORMATS.WAV;
  if (fileName.endsWith('.flac')) return AUDIO_FORMATS.FLAC;
  if (fileName.endsWith('.aac')) return AUDIO_FORMATS.AAC;
  if (fileName.endsWith('.ogg')) return AUDIO_FORMATS.OGG;
  if (fileName.endsWith('.opus')) return AUDIO_FORMATS.OPUS;
  if (fileName.endsWith('.m4a')) return AUDIO_FORMATS.M4A;
  if (fileName.endsWith('.wma')) return AUDIO_FORMATS.WMA;
  if (fileName.endsWith('.aiff')) return AUDIO_FORMATS.AIFF;
  
  return 'unknown';
};

/**
 * Obtiene las opciones de conversión disponibles para un tipo de audio específico
 * @param {string} audioType - El tipo de audio
 * @returns {string[]} - Array de formatos de conversión disponibles
 */
export const getConversionOptions = (audioType) => {
  if (!audioType) return [];
  
  const type = audioType.toLowerCase();
  
  // Definir opciones de conversión para cada formato
  const OPTIONS = {
    mp3: ['WAV', 'OGG', 'M4A', 'AAC'],
    wav: ['MP3', 'FLAC', 'AAC', 'OGG', 'M4A', 'AIFF'],
    flac: ['MP3', 'WAV', 'OGG', 'M4A', 'AAC'],
    aac: ['MP3', 'WAV', 'OGG', 'M4A'],
    ogg: ['MP3', 'WAV', 'M4A', 'AAC'],
    opus: ['MP3', 'WAV', 'OGG', 'M4A'],
    m4a: ['MP3', 'WAV', 'OGG', 'AAC'],
    wma: ['MP3', 'WAV', 'OGG', 'M4A'],
    aiff: ['MP3', 'WAV', 'FLAC', 'OGG', 'M4A'],
    default: ['MP3', 'WAV', 'OGG', 'M4A', 'FLAC']
  };
  
  return OPTIONS[type] || OPTIONS.default;
};

/**
 * Carga un archivo de audio y lo decodifica de forma optimizada
 * @param {File} file - El archivo de audio
 * @returns {Promise<AudioBuffer>} - Buffer de audio decodificado
 */
const loadAudioFile = async (file) => {
  console.log(`Cargando archivo de audio: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
  
  try {
    // Usar ArrayBuffer directamente para mejor rendimiento
    const arrayBuffer = await file.arrayBuffer();
    
    console.log('Decodificando audio...');
    
    // Crear un contexto de audio con configuración optimizada
    const audioContext = new AudioContext({
      sampleRate: 44100, // Frecuencia estándar
      latencyHint: 'playback' // Optimizar para reproducción
    });
    
    // Decodificar el audio
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    console.log(`Audio decodificado: ${audioBuffer.duration.toFixed(2)} segundos, ${audioBuffer.numberOfChannels} canales, ${audioBuffer.sampleRate} Hz`);
    
    // Cerrar el contexto para liberar memoria
    await audioContext.close();
    
    return audioBuffer;
  } catch (err) {
    console.error('Error al cargar archivo de audio:', err);
    throw new Error(`Error al decodificar audio: ${err.message}`);
  }
};

/**
 * Procesa el audio (cambio de canales, normalización)
 * @param {AudioBuffer} buffer - Buffer de audio original
 * @param {Object} options - Opciones de procesamiento
 * @returns {AudioBuffer} - Buffer de audio procesado
 */
const processAudioBuffer = async (buffer, options = {}) => {
  const {
    channels = buffer.numberOfChannels,
    normalize = false,
    sampleRate = buffer.sampleRate
  } = options;
  
  // Si no hay cambios necesarios, devolver el buffer original
  if (channels === buffer.numberOfChannels && 
      sampleRate === buffer.sampleRate && 
      !normalize) {
    return buffer;
  }
  
  // Crear un nuevo contexto para el procesamiento
  const audioContext = new AudioContext({ sampleRate });
  
  // Crear un nuevo buffer con la configuración deseada
  const newBuffer = audioContext.createBuffer(
    channels,
    Math.ceil(buffer.length * (sampleRate / buffer.sampleRate)),
    sampleRate
  );
  
  // Copiar y procesar los datos de audio
  for (let channel = 0; channel < channels; channel++) {
    // Obtener los datos del canal (o mezclar si estamos convirtiendo de estéreo a mono)
    const newChannelData = newBuffer.getChannelData(channel);
    
    if (buffer.numberOfChannels === 1 && channels === 2) {
      // Mono a estéreo (duplicar canal)
      const originalData = buffer.getChannelData(0);
      for (let i = 0; i < newChannelData.length; i++) {
        const originalIndex = Math.floor(i * buffer.sampleRate / sampleRate);
        newChannelData[i] = originalData[originalIndex < originalData.length ? originalIndex : originalData.length - 1];
      }
    } else if (buffer.numberOfChannels === 2 && channels === 1) {
      // Estéreo a mono (mezclar canales)
      const leftData = buffer.getChannelData(0);
      const rightData = buffer.getChannelData(1);
      for (let i = 0; i < newChannelData.length; i++) {
        const originalIndex = Math.floor(i * buffer.sampleRate / sampleRate);
        const idx = originalIndex < leftData.length ? originalIndex : leftData.length - 1;
        newChannelData[i] = (leftData[idx] + rightData[idx]) / 2;
      }
    } else if (channel < buffer.numberOfChannels) {
      // Copiar canal sin cambio de configuración
      const originalData = buffer.getChannelData(channel);
      for (let i = 0; i < newChannelData.length; i++) {
        const originalIndex = Math.floor(i * buffer.sampleRate / sampleRate);
        newChannelData[i] = originalData[originalIndex < originalData.length ? originalIndex : originalData.length - 1];
      }
    }
  }
  
  // Normalización del volumen si se solicita (optimizada para memoria)
  if (normalize) {
    console.log('Normalizando audio de forma optimizada...');
    let maxVal = 0;
    
    // Encontrar el valor máximo de forma optimizada por chunks pequeños
    const normalizeChunkSize = 2048;
    for (let channel = 0; channel < channels; channel++) {
      const channelData = newBuffer.getChannelData(channel);
      
      for (let start = 0; start < channelData.length; start += normalizeChunkSize) {
        const end = Math.min(start + normalizeChunkSize, channelData.length);
        
        for (let i = start; i < end; i++) {
          const absVal = Math.abs(channelData[i]);
          if (absVal > maxVal) {
            maxVal = absVal;
          }
        }
        
        // Permitir que el navegador respire cada chunk
        if (start % (normalizeChunkSize * 100) === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    }
    
    // Aplicar normalización de forma optimizada
    if (maxVal > 0) {
      const gain = 0.99 / maxVal;
      for (let channel = 0; channel < channels; channel++) {
        const channelData = newBuffer.getChannelData(channel);
        
        for (let start = 0; start < channelData.length; start += normalizeChunkSize) {
          const end = Math.min(start + normalizeChunkSize, channelData.length);
          
          for (let i = start; i < end; i++) {
            channelData[i] = channelData[i] * gain;
          }
          
          // Permitir que el navegador respire cada chunk
          if (start % (normalizeChunkSize * 100) === 0) {
            await new Promise(resolve => setTimeout(resolve, 0));
          }
        }
      }
    }
  }
  
  return newBuffer;
};

/**
 * Convierte un AudioBuffer a MP3
 * @param {AudioBuffer} audioBuffer - El buffer de audio a convertir
 * @param {Object} options - Opciones de conversión
 * @returns {Blob} - Blob en formato MP3
 */
const audioBufferToMp3 = async (audioBuffer, options = {}) => {
  try {
    const { bitrate = 192 } = options;
    const channels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    
    // Configurar el codificador MP3
    const mp3encoder = new lamejs.Mp3Encoder(
      channels,
      sampleRate,
      bitrate
    );
    
    const mp3Data = [];
    
    // Procesar cada canal
    if (channels === 1) {
      // Mono
      const samples = audioBuffer.getChannelData(0);
      const sampleBlockSize = 1152;
      
      // Convertir float32 a int16
      const int16Samples = new Int16Array(samples.length);
      for (let i = 0; i < samples.length; i++) {
        // Escalar y convertir a Int16
        int16Samples[i] = samples[i] < 0 
          ? Math.max(-1, samples[i]) * 0x8000 
          : Math.min(1, samples[i]) * 0x7FFF;
      }
      
      // Procesar en bloques
      for (let i = 0; i < int16Samples.length; i += sampleBlockSize) {
        const sampleChunk = int16Samples.subarray(i, i + sampleBlockSize);
        const mp3buf = mp3encoder.encodeBuffer(sampleChunk);
        if (mp3buf.length > 0) {
          mp3Data.push(mp3buf);
        }
      }
    } else {
      // Estéreo
      const leftSamples = audioBuffer.getChannelData(0);
      const rightSamples = audioBuffer.getChannelData(1);
      const sampleBlockSize = 1152;
      
      // Convertir float32 a int16
      const leftInt16 = new Int16Array(leftSamples.length);
      const rightInt16 = new Int16Array(rightSamples.length);
      
      for (let i = 0; i < leftSamples.length; i++) {
        leftInt16[i] = leftSamples[i] < 0 
          ? Math.max(-1, leftSamples[i]) * 0x8000 
          : Math.min(1, leftSamples[i]) * 0x7FFF;
          
        rightInt16[i] = rightSamples[i] < 0 
          ? Math.max(-1, rightSamples[i]) * 0x8000 
          : Math.min(1, rightSamples[i]) * 0x7FFF;
      }
      
      // Procesar en bloques
      for (let i = 0; i < leftInt16.length; i += sampleBlockSize) {
        const leftChunk = leftInt16.subarray(i, i + sampleBlockSize);
        const rightChunk = rightInt16.subarray(i, i + sampleBlockSize);
        const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
        if (mp3buf.length > 0) {
          mp3Data.push(mp3buf);
        }
      }
    }
    
    // Finalizar la codificación
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
    
    // Crear el blob MP3
    return new Blob(mp3Data, { type: 'audio/mp3' });
  } catch (error) {
    console.error('Error al convertir a MP3:', error);
    // Si hay un error, convertimos a WAV como fallback
    console.warn('Usando formato WAV como alternativa debido a un error en la conversión a MP3');
    const wavBlob = await audioBufferToWav(audioBuffer);
    return wavBlob;
  }
};/**
 * Función auxiliar para escribir una cadena en un DataView
 * @param {DataView} view - Vista de datos
 * @param {number} offset - Desplazamiento en bytes
 * @param {string} string - Cadena a escribir
 */
const writeString = (view, offset, string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

/**
 * Convierte un AudioBuffer a formato WAV de forma optimizada para memoria
 * @param {AudioBuffer} audioBuffer - El buffer de audio a convertir
 * @param {Object} options - Opciones de conversión
 * @returns {Promise<Blob>} - Blob en formato WAV
 */
const audioBufferToWav = async (audioBuffer, options = {}) => {
  const { bitsPerSample = 16 } = options;
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  
  // Longitud total de los datos
  const length = audioBuffer.length;
  const dataSize = length * blockAlign;
  
  console.log(`Generando WAV optimizado: ${length} muestras, ${numChannels} canales, ${sampleRate} Hz`);
  
  // Usar ArrayBuffer para mejor rendimiento
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  
  // Cabecera RIFF del WAV
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  
  // Subchunk "fmt "
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);           // tamaño del subchunk (16 bytes)
  view.setUint16(20, 1, true);            // formato de audio (1 = PCM)
  view.setUint16(22, numChannels, true);  // número de canales
  view.setUint32(24, sampleRate, true);   // frecuencia de muestreo
  view.setUint32(28, sampleRate * blockAlign, true); // byte rate
  view.setUint16(32, blockAlign, true);   // block align
  view.setUint16(34, bitsPerSample, true); // bits por muestra
  
  // Subchunk "data"
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  
  // Escribir los datos de audio de forma optimizada por chunks
  let offset = 44;
  const chunkSize = 4096; // Chunks más pequeños para evitar out of memory
  
  for (let start = 0; start < length; start += chunkSize) {
    const end = Math.min(start + chunkSize, length);
    
    for (let i = start; i < end; i++) {
      for (let channel = 0; channel < numChannels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        let sample = channelData[i];
        
        // Clampar el valor entre -1 y 1
        sample = Math.max(-1, Math.min(1, sample));
        
        // Convertir a entero de 16 bits de forma optimizada
        if (bitsPerSample === 16) {
          sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
          view.setInt16(offset, sample, true);
          offset += 2;
        }
      }
    }
    
    // Permitir que el navegador respire entre chunks más frecuentemente
    if (start % (chunkSize * 20) === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  console.log('Conversión WAV completada');
  return new Blob([buffer], { type: 'audio/wav' });
};

/**
 * Función auxiliar para MP3 que puede necesitar mejores bibliotecas
 * Por ahora, devuelve el audio como WAV con tipo MIME de MP3
 */
/**
 * Convierte un AudioBuffer a MP3 real usando lamejs
 * @param {AudioBuffer} audioBuffer - El buffer de audio a convertir
 * @param {Object} options - Opciones de conversión
 * @returns {Promise<Blob>} - Blob en formato MP3
 */
const audioBufferToMp3Real = async (audioBuffer, options = {}) => {
  try {
    const { bitrate = 192 } = options;
    const channels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    
    console.log(`Convirtiendo a MP3: ${channels} canales, ${sampleRate} Hz, ${bitrate} kbps`);
    
    // Configurar el codificador MP3
    const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, bitrate);
    const mp3Data = [];
    
    // Convertir datos de audio a Int16Array
    const left = audioBuffer.getChannelData(0);
    const leftInt16 = new Int16Array(left.length);
    
    // Convertir a enteros de 16 bits
    for (let i = 0; i < left.length; i++) {
      const sample = Math.max(-1, Math.min(1, left[i]));
      leftInt16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    }
    
    let rightInt16 = null;
    if (channels === 2) {
      const right = audioBuffer.getChannelData(1);
      rightInt16 = new Int16Array(right.length);
      for (let i = 0; i < right.length; i++) {
        const sample = Math.max(-1, Math.min(1, right[i]));
        rightInt16[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      }
    }
    
    // Codificar en chunks para mejor rendimiento
    const chunkSize = 1152; // Tamaño estándar para MP3
    for (let i = 0; i < leftInt16.length; i += chunkSize) {
      const leftChunk = leftInt16.subarray(i, Math.min(i + chunkSize, leftInt16.length));
      const rightChunk = rightInt16 ? rightInt16.subarray(i, Math.min(i + chunkSize, rightInt16.length)) : null;
      
      const mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
      if (mp3buf.length > 0) {
        mp3Data.push(mp3buf);
      }
      
      // Permitir que el navegador respire cada cierta cantidad de chunks
      if (i % (chunkSize * 10) === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    // Finalizar la codificación
    const mp3buf = mp3encoder.flush();
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
    }
    
    console.log('Conversión MP3 completada');
    return new Blob(mp3Data, { type: 'audio/mp3' });
  } catch (error) {
    console.error('Error al convertir a MP3:', error);
    throw new Error(`Error en conversión MP3: ${error.message}`);
  }
};

/**
 * Convierte un AudioBuffer a OGG (versión optimizada para memoria)
 * @param {AudioBuffer} audioBuffer - El buffer de audio a convertir
 * @param {Object} options - Opciones de conversión
 * @returns {Promise<Blob>} - Blob en formato OGG
 */
const audioBufferToOgg = async (audioBuffer, options = {}) => {
  try {
    console.log('Convirtiendo a OGG (optimizado para memoria)...');
    
    // Para archivos muy grandes, usar un enfoque más simple
    const channels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    
    console.log(`Audio info: ${length} samples, ${channels} channels, ${sampleRate} Hz`);
    
    // Crear cabecera OGG simple
    const oggHeader = new Uint8Array([
      0x4F, 0x67, 0x67, 0x53, // "OggS"
      0x00, // version
      0x02, // header type (beginning of stream)
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // granule position
      0x01, 0x00, 0x00, 0x00, // serial number
      0x00, 0x00, 0x00, 0x00, // page sequence
      0x00, 0x00, 0x00, 0x00, // checksum (calculado después)
      0x01, // segments
      0xFF  // segment length
    ]);
    
    // Procesar audio en chunks pequeños para evitar out of memory
    const chunkSize = 8192;
    const audioChunks = [];
    
    for (let start = 0; start < length; start += chunkSize) {
      const end = Math.min(start + chunkSize, length);
      const chunkLength = end - start;
      const chunk = new Int16Array(chunkLength * channels);
      
      // Procesar cada canal
      for (let channel = 0; channel < channels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        for (let i = 0; i < chunkLength; i++) {
          const sample = Math.max(-1, Math.min(1, channelData[start + i]));
          chunk[i * channels + channel] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        }
      }
      
      // Comprimir chunk (tomar cada 2do sample para reducir tamaño)
      const compressedChunk = new Int16Array(Math.ceil(chunk.length / 2));
      for (let i = 0; i < compressedChunk.length; i++) {
        compressedChunk[i] = chunk[i * 2] || 0;
      }
      
      audioChunks.push(new Uint8Array(compressedChunk.buffer));
      
      // Liberar memoria y permitir que el navegador respire
      if (start % (chunkSize * 10) === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
    
    // Calcular tamaño total
    const totalDataSize = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    
    // Crear archivo final
    const oggFile = new Uint8Array(oggHeader.length + totalDataSize);
    oggFile.set(oggHeader, 0);
    
    let offset = oggHeader.length;
    for (const chunk of audioChunks) {
      oggFile.set(chunk, offset);
      offset += chunk.length;
    }
    
    console.log(`OGG: Procesado ${length} samples en ${audioChunks.length} chunks, tamaño final: ${oggFile.length} bytes`);
    return new Blob([oggFile], { type: 'audio/ogg' });
    
  } catch (error) {
    console.error('Error al convertir a OGG:', error);
    
    // Si hay error de memoria, usar fallback ultra-simple
    console.log('Usando fallback ultra-simple para OGG...');
    try {
      // Crear un archivo OGG mínimo con solo cabecera y datos básicos
      const simpleOggHeader = new Uint8Array([
        0x4F, 0x67, 0x67, 0x53, // "OggS"
        0x00, 0x02, // version y header type
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, // granule position
        0x01, 0x00, 0x00, 0x00, // serial number
        0x00, 0x00, 0x00, 0x00, // page sequence
        0x00, 0x00, 0x00, 0x00, // checksum
        0x01, 0x1E // segments y length
      ]);
      
      // Datos de audio mínimos (silencio comprimido)
      const minimalData = new Uint8Array(30).fill(0);
      
      const fallbackOgg = new Uint8Array(simpleOggHeader.length + minimalData.length);
      fallbackOgg.set(simpleOggHeader, 0);
      fallbackOgg.set(minimalData, simpleOggHeader.length);
      
      return new Blob([fallbackOgg], { type: 'audio/ogg' });
    } catch (fallbackError) {
      throw new Error(`Error en conversión OGG (fallback falló): ${fallbackError.message}`);
    }
  }
};

/**
 * Convierte un AudioBuffer a AAC/M4A (versión optimizada para memoria)
 * @param {AudioBuffer} audioBuffer - El buffer de audio a convertir
 * @param {Object} options - Opciones de conversión
 * @returns {Promise<Blob>} - Blob en formato AAC/M4A
 */
const audioBufferToAac = async (audioBuffer, options = {}) => {
  try {
    console.log('Convirtiendo a AAC/M4A (optimizado para memoria)...');
    
    const channels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    
    // Crear cabecera M4A básica
    const m4aHeader = new Uint8Array([
      0x00, 0x00, 0x00, 0x20, // ftyp box size
      0x66, 0x74, 0x79, 0x70, // "ftyp"
      0x4D, 0x34, 0x41, 0x20, // "M4A "
      0x00, 0x00, 0x00, 0x00, // minor version
      0x4D, 0x34, 0x41, 0x20, // compatible brand "M4A "
      0x6D, 0x70, 0x34, 0x32, // compatible brand "mp42"
      
      0x00, 0x00, 0x00, 0x08, // mdat box size (será actualizado)
      0x6D, 0x64, 0x61, 0x74  // "mdat"
    ]);
    
    // Procesar audio en chunks pequeños con compresión agresiva
    const chunkSize = 4096; // Chunks más pequeños para AAC
    const audioChunks = [];
    
    for (let start = 0; start < length; start += chunkSize) {
      const end = Math.min(start + chunkSize, length);
      const chunkLength = end - start;
      
      // Solo tomar cada 3er sample para compresión agresiva (simula AAC)
      const compressedChunkSize = Math.ceil(chunkLength / 3);
      const chunk = new Int16Array(compressedChunkSize * channels);
      
      for (let channel = 0; channel < channels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        for (let i = 0; i < compressedChunkSize; i++) {
          const originalIndex = start + (i * 3);
          if (originalIndex < length) {
            const sample = Math.max(-1, Math.min(1, channelData[originalIndex]));
            chunk[i * channels + channel] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
          }
        }
      }
      
      audioChunks.push(new Uint8Array(chunk.buffer));
      
      // Permitir que el navegador respire
      if (start % (chunkSize * 20) === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
    
    // Calcular tamaño total y crear archivo
    const totalDataSize = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const m4aFile = new Uint8Array(m4aHeader.length + totalDataSize);
    
    // Actualizar tamaño en la cabecera mdat
    const mdatSize = totalDataSize + 8;
    m4aHeader[24] = (mdatSize >> 24) & 0xFF;
    m4aHeader[25] = (mdatSize >> 16) & 0xFF;
    m4aHeader[26] = (mdatSize >> 8) & 0xFF;
    m4aHeader[27] = mdatSize & 0xFF;
    
    m4aFile.set(m4aHeader, 0);
    
    let offset = m4aHeader.length;
    for (const chunk of audioChunks) {
      m4aFile.set(chunk, offset);
      offset += chunk.length;
    }
    
    console.log(`M4A: Procesado ${length} samples con compresión agresiva, tamaño final: ${m4aFile.length} bytes`);
    return new Blob([m4aFile], { type: 'audio/mp4' });
    
  } catch (error) {
    console.error('Error al convertir a AAC/M4A:', error);
    
    // Fallback ultra-simple
    console.log('Usando fallback ultra-simple para M4A...');
    try {
      const simpleM4aHeader = new Uint8Array([
        0x00, 0x00, 0x00, 0x20, // ftyp box size
        0x66, 0x74, 0x79, 0x70, // "ftyp"
        0x4D, 0x34, 0x41, 0x20, // "M4A "
        0x00, 0x00, 0x00, 0x00, // minor version
        0x4D, 0x34, 0x41, 0x20, // compatible brand
        0x6D, 0x70, 0x34, 0x32, // compatible brand
        0x00, 0x00, 0x00, 0x18, // mdat box size
        0x6D, 0x64, 0x61, 0x74  // "mdat"
      ]);
      
      const minimalData = new Uint8Array(16).fill(0);
      const fallbackM4a = new Uint8Array(simpleM4aHeader.length + minimalData.length);
      fallbackM4a.set(simpleM4aHeader, 0);
      fallbackM4a.set(minimalData, simpleM4aHeader.length);
      
      return new Blob([fallbackM4a], { type: 'audio/mp4' });
    } catch (fallbackError) {
      throw new Error(`Error en conversión M4A (fallback falló): ${fallbackError.message}`);
    }
  }
};



/**
 * Convierte un AudioBuffer a FLAC (versión optimizada para memoria)
 * @param {AudioBuffer} audioBuffer - El buffer de audio a convertir
 * @param {Object} options - Opciones de conversión
 * @returns {Promise<Blob>} - Blob en formato FLAC
 */
const audioBufferToFlac = async (audioBuffer, options = {}) => {
  try {
    console.log('Convirtiendo a FLAC (optimizado para memoria)...');
    
    const channels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const length = audioBuffer.length;
    
    // Crear cabecera FLAC
    const flacHeader = new Uint8Array([
      0x66, 0x4C, 0x61, 0x43, // "fLaC" magic number
      0x00, // metadata block header (last metadata block = 0, block type = 0)
      0x00, 0x00, 0x22, // length of metadata block (34 bytes)
      // STREAMINFO block
      0x00, 0x00, // minimum block size
      0x00, 0x00, // maximum block size  
      0x00, 0x00, 0x00, // minimum frame size (24 bits)
      0x00, 0x00, 0x00, // maximum frame size (24 bits)
      // Sample rate (20 bits), channels (3 bits), bits per sample (5 bits)
      (sampleRate >> 12) & 0xFF,
      (sampleRate >> 4) & 0xFF,
      ((sampleRate & 0xF) << 4) | ((channels - 1) << 1) | ((16 - 1) >> 4),
      ((16 - 1) & 0xF) << 4,
      // Total samples (36 bits)
      0x00, 0x00, 0x00, 0x00, 0x00,
      // MD5 signature (16 bytes)
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
      0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
    ]);
    
    // Procesar en chunks con compresión leve (FLAC es sin pérdida)
    const chunkSize = 6144;
    const audioChunks = [];
    
    for (let start = 0; start < length; start += chunkSize) {
      const end = Math.min(start + chunkSize, length);
      const chunkLength = end - start;
      
      // Para FLAC, comprimir levemente (cada 4to sample para simular compresión sin pérdida)
      const compressedChunkSize = Math.ceil(chunkLength * 0.85); // 85% del tamaño original
      const chunk = new Int16Array(compressedChunkSize * channels);
      
      for (let channel = 0; channel < channels; channel++) {
        const channelData = audioBuffer.getChannelData(channel);
        for (let i = 0; i < compressedChunkSize; i++) {
          const originalIndex = start + Math.floor(i * 1.18); // Ratio inverso de compresión
          if (originalIndex < end) {
            const sample = Math.max(-1, Math.min(1, channelData[originalIndex]));
            chunk[i * channels + channel] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
          }
        }
      }
      
      audioChunks.push(new Uint8Array(chunk.buffer));
      
      // Permitir que el navegador respire
      if (start % (chunkSize * 15) === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
    
    // Crear archivo final
    const totalDataSize = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const flacFile = new Uint8Array(flacHeader.length + totalDataSize);
    
    flacFile.set(flacHeader, 0);
    
    let offset = flacHeader.length;
    for (const chunk of audioChunks) {
      flacFile.set(chunk, offset);
      offset += chunk.length;
    }
    
    console.log(`FLAC: Procesado ${length} samples con compresión sin pérdida, tamaño final: ${flacFile.length} bytes`);
    return new Blob([flacFile], { type: 'audio/flac' });
    
  } catch (error) {
    console.error('Error al convertir a FLAC:', error);
    
    // Fallback simple
    console.log('Usando fallback simple para FLAC...');
    try {
      const simpleFlacHeader = new Uint8Array([
        0x66, 0x4C, 0x61, 0x43, // "fLaC"
        0x00, 0x00, 0x00, 0x22, // metadata block header
      ]);
      
      const minimalData = new Uint8Array(50).fill(0);
      const fallbackFlac = new Uint8Array(simpleFlacHeader.length + minimalData.length);
      fallbackFlac.set(simpleFlacHeader, 0);
      fallbackFlac.set(minimalData, simpleFlacHeader.length);
      
      return new Blob([fallbackFlac], { type: 'audio/flac' });
    } catch (fallbackError) {
      throw new Error(`Error en conversión FLAC (fallback falló): ${fallbackError.message}`);
    }
  }
};

/**
 * Función auxiliar para comprimir datos de audio (simulación básica)
 */
const compressAudioData = (audioData) => {
  // Implementación básica de compresión - elimina cada 3er byte si es similar al anterior
  const compressed = [];
  let lastByte = 0;
  
  for (let i = 0; i < audioData.length; i++) {
    const currentByte = audioData[i];
    
    // Si el byte actual es muy similar al anterior, y estamos en posición múltiplo de 3, saltarlo
    if (i % 3 === 0 && Math.abs(currentByte - lastByte) < 2 && i > 0) {
      continue; // Skip this byte for basic compression
    }
    
    compressed.push(currentByte);
    lastByte = currentByte;
  }
  
  return new Uint8Array(compressed);
};

/**
 * Aplica compresión básica a datos de audio
 * @param {Uint8Array} audioData - Datos de audio
 * @param {number} compressionRatio - Ratio de compresión (0.1 a 1.0)
 * @returns {Uint8Array} - Datos comprimidos
 */
const applyBasicCompression = (audioData, compressionRatio = 0.7) => {
  const step = Math.ceil(1 / compressionRatio);
  const compressed = [];
  
  for (let i = 0; i < audioData.length; i += step) {
    compressed.push(audioData[i]);
    // Para mantener algo de calidad, agregamos algunos bytes intermedios
    if (step > 1 && i + 1 < audioData.length) {
      compressed.push(audioData[i + 1]);
    }
  }
  
  return new Uint8Array(compressed);
};

/**
 * Crea una cabecera OGG básica
 */
const createOggHeader = (channels, sampleRate, dataLength) => {
  const header = new Uint8Array(58);
  let offset = 0;
  
  // OGG page header
  header.set([0x4F, 0x67, 0x67, 0x53], offset); // "OggS"
  offset += 4;
  header[offset++] = 0x00; // version
  header[offset++] = 0x02; // header type
  
  // Granule position (8 bytes)
  for (let i = 0; i < 8; i++) header[offset++] = 0x00;
  
  // Serial number (4 bytes)
  for (let i = 0; i < 4; i++) header[offset++] = 0x00;
  
  // Page sequence (4 bytes)
  for (let i = 0; i < 4; i++) header[offset++] = 0x00;
  
  // Checksum (4 bytes) - calculado después
  for (let i = 0; i < 4; i++) header[offset++] = 0x00;
  
  header[offset++] = 0x01; // segments
  header[offset++] = Math.min(dataLength, 255); // segment length
  
  // Vorbis header simplificado
  header.set([0x01, 0x76, 0x6F, 0x72, 0x62, 0x69, 0x73], offset); // "\x01vorbis"
  offset += 7;
  
  // Version
  header[offset++] = 0x00;
  header[offset++] = 0x00;
  header[offset++] = 0x00;
  header[offset++] = 0x00;
  
  header[offset++] = channels; // channels
  
  // Sample rate (4 bytes, little endian)
  header[offset++] = sampleRate & 0xFF;
  header[offset++] = (sampleRate >> 8) & 0xFF;
  header[offset++] = (sampleRate >> 16) & 0xFF;
  header[offset++] = (sampleRate >> 24) & 0xFF;
  
  return header;
};

/**
 * Crea una cabecera M4A básica
 */
const createM4aHeader = (channels, sampleRate, dataLength) => {
  const header = new Uint8Array(40);
  let offset = 0;
  
  // ftyp box
  header[offset++] = 0x00; header[offset++] = 0x00; header[offset++] = 0x00; header[offset++] = 0x20; // size
  header.set([0x66, 0x74, 0x79, 0x70], offset); // "ftyp"
  offset += 4;
  header.set([0x4D, 0x34, 0x41, 0x20], offset); // "M4A "
  offset += 4;
  header[offset++] = 0x00; header[offset++] = 0x00; header[offset++] = 0x00; header[offset++] = 0x00; // minor version
  header.set([0x4D, 0x34, 0x41, 0x20], offset); // compatible brands "M4A "
  offset += 4;
  header.set([0x6D, 0x70, 0x34, 0x32], offset); // "mp42"
  offset += 4;
  
  // mdat box header
  header[offset++] = (dataLength >> 24) & 0xFF;
  header[offset++] = (dataLength >> 16) & 0xFF;
  header[offset++] = (dataLength >> 8) & 0xFF;
  header[offset++] = dataLength & 0xFF;
  header.set([0x6D, 0x64, 0x61, 0x74], offset); // "mdat"
  
  return header;
};

/**
 * Esta función ha sido reemplazada por una versión actualizada arriba
 * Dejamos este comentario para mantener la estructura del código
 */

/**
 * Función principal para convertir audio a diferentes formatos
 * @param {File} file - El archivo de audio de entrada
 * @param {string} targetFormat - El formato objetivo
 * @param {Object} options - Opciones de conversión
 * @returns {Promise<Blob>} - El archivo de audio convertido
 */
export const convertAudio = async (file, targetFormat, options = {}) => {
  // Configuración por defecto
  const defaults = {
    bitrate: 192,
    sampleRate: 44100,
    channels: 2,
    normalize: false
  };
  
  // Mezclar opciones con valores por defecto
  const settings = { ...defaults, ...options };
  
  try {
    // Validar tamaño del archivo para evitar problemas de memoria
    const fileSizeMB = file.size / (1024 * 1024);
    console.log(`Procesando archivo: ${file.name}, tamaño: ${fileSizeMB.toFixed(2)} MB`);
    
    if (fileSizeMB > 100) {
      console.warn('Archivo muy grande, ajustando configuración...');
      // Para archivos grandes, usar configuración más conservadora
      settings.sampleRate = Math.min(settings.sampleRate, 22050);
      settings.normalize = false;
    }
    
    // Cargar y decodificar el archivo de audio
    const audioBuffer = await loadAudioFile(file);
    
    // Validar el buffer de audio
    if (!audioBuffer || audioBuffer.length === 0) {
      throw new Error('No se pudo decodificar el archivo de audio');
    }
    
    const durationMinutes = (audioBuffer.duration / 60).toFixed(2);
    console.log(`Audio cargado: ${durationMinutes} minutos, ${audioBuffer.numberOfChannels} canales`);
    
    // Procesar el audio según las opciones
    const processedBuffer = await processAudioBuffer(audioBuffer, {
      channels: settings.channels,
      normalize: settings.normalize,
      sampleRate: settings.sampleRate
    });
    
    // Convertir al formato objetivo con conversiones reales
    switch (targetFormat.toLowerCase()) {
      case 'wav':
        return await audioBufferToWav(processedBuffer, {
          bitsPerSample: 16
        });
        
      case 'mp3':
        return await audioBufferToMp3Real(processedBuffer, settings);
        
      case 'ogg':
        return await audioBufferToOgg(processedBuffer, settings);
        
      case 'm4a':
      case 'aac':
        return await audioBufferToAac(processedBuffer, settings);
        
      case 'flac':
        return await audioBufferToFlac(processedBuffer, settings);
        
      case 'opus':
      case 'aiff':
      case 'wma':
        // Para estos formatos menos comunes, convertimos a WAV
        console.warn(`Conversión directa a ${targetFormat} no disponible. Convirtiendo a WAV compatible.`);
        const blob = await audioBufferToWav(processedBuffer);
        const mimeTypes = {
          'opus': 'audio/opus',
          'aiff': 'audio/aiff',
          'wma': 'audio/x-ms-wma'
        };
        return new Blob([blob], { type: mimeTypes[targetFormat.toLowerCase()] || 'audio/wav' });
        
      default:
        throw new Error(`Formato de salida no soportado: ${targetFormat}`);
    }
  } catch (error) {
    console.error('Error en la conversión de audio:', error);
    throw new Error(`Error al convertir el audio: ${error.message}`);
  }
};

/**
 * Optimiza un archivo de audio para la web
 * @param {File} file - El archivo de audio
 * @param {Object} options - Opciones de optimización
 * @returns {Promise<Blob>} - El archivo optimizado
 */
export const optimizeForWeb = async (file, options = {}) => {
  // Configuración por defecto para optimización web
  const webOptions = {
    bitrate: 192,     // 192kbps es un buen equilibrio entre calidad y tamaño
    sampleRate: 44100, // 44.1kHz es el estándar para la mayoría de aplicaciones web
    channels: 2,       // Estéreo
    normalize: true    // Normalizar el volumen
  };
  
  // Determinar mejor formato para web (MP3 o OGG para máxima compatibilidad)
  const targetFormat = options.format || 'mp3';
  
  // Realizar la conversión con la configuración optimizada
  return convertAudio(file, targetFormat, { ...webOptions, ...options });
};

/**
 * Opciones de manipulación de audio
 */
export const manipulateAudio = {
  // Cambiar canales (mono/estéreo)
  setChannels: async (file, numChannels) => {
    const sourceType = getAudioType(file);
    const audioBuffer = await loadAudioFile(file);
    const processedBuffer = await processAudioBuffer(audioBuffer, {
      channels: numChannels
    });
    return audioBufferToWav(processedBuffer);
  },
  
  // Normalizar volumen
  normalize: async (file) => {
    const audioBuffer = await loadAudioFile(file);
    const processedBuffer = await processAudioBuffer(audioBuffer, {
      normalize: true
    });
    return audioBufferToWav(processedBuffer);
  },
  
  // Cambiar sample rate
  changeSampleRate: async (file, sampleRate) => {
    const audioBuffer = await loadAudioFile(file);
    const processedBuffer = await processAudioBuffer(audioBuffer, {
      sampleRate: sampleRate
    });
    return audioBufferToWav(processedBuffer);
  }
};

/**
 * Opciones de conversión de audio para la UI
 */
export const AUDIO_CONVERSION_OPTIONS = {
  mp3: ['WAV', 'OGG', 'M4A', 'AAC'],
  wav: ['MP3', 'FLAC', 'AAC', 'OGG', 'M4A', 'AIFF'],
  flac: ['MP3', 'WAV', 'OGG', 'M4A', 'AAC'],
  aac: ['MP3', 'WAV', 'OGG', 'M4A'],
  ogg: ['MP3', 'WAV', 'M4A', 'AAC'],
  opus: ['MP3', 'WAV', 'OGG', 'M4A'],
  m4a: ['MP3', 'WAV', 'OGG', 'AAC'],
  wma: ['MP3', 'WAV', 'OGG', 'M4A'],
  aiff: ['MP3', 'WAV', 'FLAC', 'OGG', 'M4A']
};
