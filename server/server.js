import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Lista de orígenes permitidos
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://files2any.com',
  'https://www.files2any.com',
  process.env.FRONTEND_URL
].filter(Boolean);

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Permitir peticiones sin origin (como curl o Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // En producción puedes restringir esto
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true
}));
app.use(express.json());

// Usar carpeta temporal del sistema (NO en el proyecto)
const downloadsDir = path.join(os.tmpdir(), 'file2any-downloads');
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

// Limpiar archivos temporales antiguos (más de 10 minutos)
const cleanOldFiles = () => {
  try {
    const files = fs.readdirSync(downloadsDir);
    const now = Date.now();
    files.forEach(file => {
      const filePath = path.join(downloadsDir, file);
      try {
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > 600000) { // 10 minutos
          fs.unlinkSync(filePath);
        }
      } catch (e) {}
    });
  } catch (error) {}
};

// Limpiar cada 5 minutos
setInterval(cleanOldFiles, 300000);
cleanOldFiles(); // Limpiar al iniciar

// Endpoint para obtener información del video usando yt-dlp
app.post('/api/youtube/info', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL es requerida' });
    }

    // Validar que sea una URL de YouTube válida
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)[a-zA-Z0-9_-]+/;
    if (!youtubeRegex.test(url)) {
      return res.status(400).json({ error: 'URL de YouTube inválida' });
    }

    console.log('Obteniendo información del video:', url);

    // Estrategia anti-bot mejorada - usar cookies y múltiples clientes
    const ytdlpArgs = [
      '--no-warnings',
      '--skip-download',
      '--print-json',
      '--no-playlist',
      '--extractor-args', 'youtube:player_client=android_embedded',
      '--no-check-certificates',
      '--socket-timeout', '30',
      '--retries', '3',
      '--geo-bypass',
      url
    ];

    const ytdlp = spawn('yt-dlp', ytdlpArgs, {
      timeout: 60000 // 60 segundos timeout
    });
    
    let stdout = '';
    let stderr = '';

    ytdlp.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    ytdlp.stderr.on('data', (data) => {
      stderr += data.toString();
      console.log('yt-dlp:', data.toString());
    });

    // Timeout manual de 45 segundos
    const timeoutId = setTimeout(() => {
      ytdlp.kill('SIGTERM');
    }, 45000);

    await new Promise((resolve, reject) => {
      ytdlp.on('close', (code) => {
        clearTimeout(timeoutId);
        if (code !== 0 && code !== null) {
          reject(new Error(`yt-dlp falló (código ${code}): ${stderr}`));
        } else if (!stdout.trim()) {
          reject(new Error('No se recibió respuesta de yt-dlp'));
        } else {
          resolve();
        }
      });
      
      ytdlp.on('error', (error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
    });
    
    if (stderr) {
      console.error('yt-dlp stderr:', stderr);
    }
    
    const videoData = JSON.parse(stdout);

    const videoInfo = {
      title: videoData.title,
      author: videoData.uploader || videoData.channel,
      lengthSeconds: videoData.duration,
      thumbnail: videoData.thumbnail,
      description: videoData.description?.substring(0, 200),
      viewCount: videoData.view_count
    };

    console.log('Información obtenida exitosamente:', videoInfo.title);
    res.json(videoInfo);
  } catch (error) {
    console.error('Error completo al obtener información del video:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Error al obtener información del video',
      details: error.message,
      stderr: error.stderr || 'No stderr disponible'
    });
  }
});

// Endpoint para descargar el video usando yt-dlp
app.post('/api/youtube/download', async (req, res) => {
  try {
    const { url, quality = 'best', format = 'mp4' } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL es requerida' });
    }

    // Validar URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)[a-zA-Z0-9_-]+/;
    if (!youtubeRegex.test(url)) {
      return res.status(400).json({ error: 'URL de YouTube inválida' });
    }

    // Generar nombre de archivo único (sin caracteres especiales)
    const timestamp = Date.now();
    const outputFile = path.join(downloadsDir, `${timestamp}.%(ext)s`);
    const finalFile = path.join(downloadsDir, `${timestamp}.mp4`);
    const finalFileAudio = path.join(downloadsDir, `${timestamp}.mp3`);

    // Opciones comunes anti-bot
    const commonArgs = [
      '--no-playlist',
      '--no-warnings',
      '--no-check-certificates',
      '--extractor-args', 'youtube:player_client=android_embedded',
      '--socket-timeout', '30',
      '--retries', '3',
      '--geo-bypass',
    ];

    // Construir comando yt-dlp
    let ytdlpArgs = [];
    let expectedFile = finalFile;
    
    if (quality === 'audio') {
      // Solo audio - descargar y convertir a MP3
      ytdlpArgs = [
        '-f', 'bestaudio',
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', '0',
        '-o', outputFile,
        ...commonArgs,
        url
      ];
      expectedFile = finalFileAudio;
    } else {
      // Video con audio
      let formatString;
      
      if (quality === 'highest') {
        formatString = 'bv*+ba/b';
      } else {
        const height = quality.replace('p', '');
        formatString = `bv*[height<=${height}]+ba/b[height<=${height}]/b`;
      }
      
      ytdlpArgs = [
        '-f', formatString,
        '--merge-output-format', 'mp4',
        '-o', outputFile,
        ...commonArgs,
        url
      ];
    }

    console.log('Ejecutando yt-dlp con args:', ytdlpArgs.join(' '));

    // Ejecutar yt-dlp
    const ytdlp = spawn('yt-dlp', ytdlpArgs);

    let errorOutput = '';
    let stdOutput = '';

    ytdlp.stdout.on('data', (data) => {
      const output = data.toString();
      stdOutput += output;
      console.log('yt-dlp:', output);
    });

    ytdlp.stderr.on('data', (data) => {
      const output = data.toString();
      errorOutput += output;
      // yt-dlp muestra progreso en stderr, mostrarlo también
      if (output.includes('[download]') || output.includes('Merging')) {
        console.log('yt-dlp:', output);
      } else {
        console.error('yt-dlp error:', output);
      }
    });

    ytdlp.on('close', async (code) => {
      if (code !== 0) {
        console.error('yt-dlp falló con código:', code);
        if (!res.headersSent) {
          return res.status(500).json({ 
            error: 'Error al descargar el video',
            details: errorOutput 
          });
        }
        return;
      }

      // Buscar el archivo final (puede tener extensión diferente)
      let foundFile = null;
      const possibleExtensions = quality === 'audio' ? ['.mp3', '.m4a', '.webm', '.opus'] : ['.mp4', '.mkv', '.webm'];
      
      for (const ext of possibleExtensions) {
        const testFile = path.join(downloadsDir, `${timestamp}${ext}`);
        if (fs.existsSync(testFile)) {
          foundFile = testFile;
          break;
        }
      }

      // Si no encontramos con las extensiones esperadas, buscar cualquier archivo con el timestamp
      if (!foundFile) {
        const files = fs.readdirSync(downloadsDir)
          .filter(f => f.startsWith(timestamp.toString()))
          .map(f => path.join(downloadsDir, f));
        
        if (files.length > 0) {
          // Preferir el archivo .mp4 si existe
          foundFile = files.find(f => f.endsWith('.mp4')) || files[0];
        }
      }

      if (!foundFile || !fs.existsSync(foundFile)) {
        console.error('Archivos en directorio:', fs.readdirSync(downloadsDir));
        if (!res.headersSent) {
          return res.status(500).json({ error: 'No se pudo encontrar el archivo descargado' });
        }
        return;
      }

      console.log('Archivo encontrado:', foundFile);

      try {
        const stats = fs.statSync(foundFile);
        const ext = path.extname(foundFile);
        const safeFileName = `video_${timestamp}${ext}`;
        
        // Determinar content-type basado en extensión real
        let contentType = 'video/mp4';
        if (ext === '.mp3') contentType = 'audio/mpeg';
        else if (ext === '.webm') contentType = quality === 'audio' ? 'audio/webm' : 'video/webm';
        else if (ext === '.mkv') contentType = 'video/x-matroska';
        else if (ext === '.m4a') contentType = 'audio/mp4';
        
        res.setHeader('Content-Disposition', `attachment; filename="${safeFileName}"`);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stats.size);

        const fileStream = fs.createReadStream(foundFile);
        
        fileStream.pipe(res);
        
        fileStream.on('end', () => {
          // Eliminar archivo después de enviarlo
          setTimeout(() => {
            try {
              if (fs.existsSync(foundFile)) {
                fs.unlinkSync(foundFile);
                console.log('Archivo temporal eliminado:', foundFile);
              }
              // Limpiar cualquier archivo residual con el mismo timestamp
              const residualFiles = fs.readdirSync(downloadsDir)
                .filter(f => f.startsWith(timestamp.toString()));
              residualFiles.forEach(f => {
                try {
                  fs.unlinkSync(path.join(downloadsDir, f));
                } catch (e) {}
              });
            } catch (e) {
              console.error('Error eliminando archivo temporal:', e);
            }
          }, 2000);
        });

        fileStream.on('error', (err) => {
          console.error('Error leyendo archivo:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Error leyendo el archivo' });
          }
        });
      } catch (err) {
        console.error('Error enviando archivo:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error enviando el archivo' });
        }
      }
    });

  } catch (error) {
    console.error('Error al descargar video:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Error al descargar el video',
        details: error.message 
      });
    }
  }
});

// Endpoint de salud
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando correctamente' });
});

// Verificar que yt-dlp está instalado
exec('yt-dlp --version', (error, stdout) => {
  if (error) {
    console.error('⚠️  ADVERTENCIA: yt-dlp no está instalado. Instálalo con: pip install yt-dlp');
  } else {
    console.log(`✅ yt-dlp versión: ${stdout.trim()}`);
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📁 Carpeta de descargas: ${downloadsDir}`);
});
