/**
 * Recorta un archivo de audio usando Web Audio API y lo exporta a WAV.
 * @param {File} file - El archivo de audio original.
 * @param {number} startTime - Tiempo de inicio en segundos.
 * @param {number} endTime - Tiempo de fin en segundos.
 * @param {function} onProgress - Callback para reportar progreso.
 * @returns {Promise<Blob>} - Blob del archivo WAV recortado.
 */
export const trimAudio = async (file, startTime, endTime, onProgress) => {
  try {
    if (onProgress) onProgress('Cargando audio...');
    
    const arrayBuffer = await file.arrayBuffer();
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    if (onProgress) onProgress('Decodificando audio...');
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    
    const duration = audioBuffer.duration;
    if (startTime < 0) startTime = 0;
    if (endTime > duration) endTime = duration;
    if (startTime >= endTime) throw new Error("El tiempo de inicio debe ser menor al tiempo de fin.");

    const sampleRate = audioBuffer.sampleRate;
    const startFrame = Math.floor(startTime * sampleRate);
    const endFrame = Math.floor(endTime * sampleRate);
    const frameCount = endFrame - startFrame;
    
    // Crear un nuevo buffer con el segmento recortado
    const numberOfChannels = audioBuffer.numberOfChannels;
    const trimmedBuffer = audioContext.createBuffer(numberOfChannels, frameCount, sampleRate);
    
    for (let i = 0; i < numberOfChannels; i++) {
      const channelData = audioBuffer.getChannelData(i);
      const trimmedData = trimmedBuffer.getChannelData(i);
      // Copiar los datos del segmento
      for (let j = 0; j < frameCount; j++) {
        trimmedData[j] = channelData[startFrame + j];
      }
    }

    if (onProgress) onProgress('Generando archivo WAV...');
    
    // Convertir AudioBuffer a WAV
    const wavBlob = bufferToWave(trimmedBuffer, frameCount);
    
    return wavBlob;
  } catch (error) {
    console.error("Error en trimAudio:", error);
    throw error;
  }
};

// Función auxiliar para convertir AudioBuffer a Blob WAV
function bufferToWave(abuffer, len) {
  const numOfChan = abuffer.numberOfChannels;
  const length = len * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit (hardcoded in this function)

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // write interleaved data
  for (i = 0; i < abuffer.numberOfChannels; i++)
    channels.push(abuffer.getChannelData(i));

  while (pos < len) {
    for (i = 0; i < numOfChan; i++) {
      // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
      view.setInt16(44 + offset, sample, true); // write 16-bit sample
      offset += 2;
    }
    pos++;
  }

  return new Blob([buffer], { type: "audio/wav" });

  function setUint16(data) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}
