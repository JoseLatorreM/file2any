import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import mysql from 'mysql2/promise';

const execAsync = promisify(exec);

// Configuración de la Base de Datos
// En producción, Hostinger suele usar 'localhost' si el Node.js corre en el mismo servidor que MySQL.
const dbConfig = {
  host: process.env.DB_HOST || 'localhost', 
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let dbPool;

// Intentar conectar a la BD
const initDB = async () => {
  try {
    dbPool = mysql.createPool(dbConfig);
    // Verificar conexión
    const connection = await dbPool.getConnection();
    console.log('✅ Conectado a la base de datos MySQL');
    
    // NOTA: Asumimos que la tabla 'suggestions' ya existe en la base de datos.
    // No ejecutamos CREATE TABLE ni ALTER TABLE automáticamente.

    connection.release();
  } catch (error) {
    console.error('❌ Error conectando a la BD:', error.message);
    // No detenemos el servidor si falla la BD, solo no funcionarán los comentarios
  }
};

initDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

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

// --- RUTAS DE COMENTARIOS (MySQL) ---

app.get('/api/comments', async (req, res) => {
  if (!dbPool) return res.status(503).json({ error: 'Base de datos no disponible' });
  try {
    const [rows] = await dbPool.query('SELECT * FROM suggestions ORDER BY created_at DESC LIMIT 50');
    res.json(rows);
  } catch (error) {
    console.error('Error obteniendo comentarios:', error);
    res.status(500).json({ error: 'Error al obtener comentarios' });
  }
});

app.post('/api/comments', async (req, res) => {
  if (!dbPool) return res.status(503).json({ error: 'Base de datos no disponible' });
  const { username, tool_name, comment } = req.body;
  
  if (!username || !comment) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }

  // Validaciones de seguridad y longitud
  // Limitar longitud para evitar problemas visuales y de almacenamiento
  if (username.length > 50) return res.status(400).json({ error: 'El nombre no puede exceder 50 caracteres' });
  if (tool_name && tool_name.length > 100) return res.status(400).json({ error: 'El nombre de la herramienta no puede exceder 100 caracteres' });
  if (comment.length > 500) return res.status(400).json({ error: 'El comentario no puede exceder 500 caracteres' });

  try {
    // El uso de parámetros (?) en mysql2 previene inyecciones SQL automáticamente.
    // Los valores se escapan y se tratan estrictamente como texto/datos, nunca como comandos ejecutables.
    const [result] = await dbPool.query(
      'INSERT INTO suggestions (username, tool_name, comment) VALUES (?, ?, ?)',
      [username, tool_name || 'General', comment]
    );
    res.status(201).json({ id: result.insertId, message: 'Comentario guardado' });
  } catch (error) {
    console.error('Error guardando comentario:', error);
    res.status(500).json({ error: 'Error al guardar comentario' });
  }
});

app.post('/api/comments/:id/like', async (req, res) => {
  if (!dbPool) return res.status(503).json({ error: 'Base de datos no disponible' });
  const { id } = req.params;
  
  try {
    await dbPool.query('UPDATE suggestions SET likes = likes + 1 WHERE id = ?', [id]);
    res.json({ message: 'Like agregado' });
  } catch (error) {
    console.error('Error agregando like:', error);
    res.status(500).json({ error: 'Error al agregar like' });
  }
});

// --- FIN RUTAS COMENTARIOS ---

// --- RUTAS SPEEDTEST ---
// Endpoint de descarga: Genera datos aleatorios para probar la velocidad de bajada
app.get('/api/speedtest/download', (req, res) => {
  const size = 10 * 1024 * 1024; // 10MB por defecto
  const buffer = Buffer.alloc(size, 'a'); // Llenar con 'a' es rápido
  res.set({
    'Content-Type': 'application/octet-stream',
    'Content-Length': size,
    'Cache-Control': 'no-store'
  });
  res.send(buffer);
});

// Endpoint de subida: Recibe datos y los descarta para probar la velocidad de subida
app.post('/api/speedtest/upload', express.raw({ limit: '50mb', type: '*/*' }), (req, res) => {
  // Express ya ha leído el body en memoria si usamos el middleware adecuado, 
  // o podemos usar streams para no saturar RAM.
  // Para simplificar y dado que express.raw lee todo, solo respondemos OK.
  // El tiempo que tarda en llegar aquí es el tiempo de subida.
  res.sendStatus(200);
});
// --- FIN RUTAS SPEEDTEST ---

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📁 Carpeta de descargas: ${downloadsDir}`);
});
