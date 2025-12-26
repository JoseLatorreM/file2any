# File2Any Backend Server

Backend API para descargas de YouTube usando yt-dlp.

## Tecnologías
- Node.js + Express
- yt-dlp
- Docker

## Endpoints

### GET /health
Verifica el estado del servidor.

**Response:**
```json
{
  "status": "ok",
  "message": "Servidor funcionando correctamente"
}
```

### POST /api/youtube/info
Obtiene información de un video de YouTube.

**Request Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**Response:**
```json
{
  "title": "Título del video",
  "author": "Nombre del canal",
  "lengthSeconds": 180,
  "thumbnail": "URL de la miniatura",
  "description": "Descripción...",
  "viewCount": 12345
}
```

### POST /api/youtube/download
Descarga un video de YouTube.

**Request Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "quality": "highest|1080p|720p|480p|360p|audio",
  "format": "mp4|mp3"
}
```

**Response:**
Archivo binario (video o audio)

## Variables de Entorno

- `PORT`: Puerto del servidor (default: 3002)
- `FRONTEND_URL`: URL del frontend para CORS
- `NODE_ENV`: Entorno de ejecución

## Desarrollo Local

```bash
npm install
npm run dev
```

## Despliegue en Render

El proyecto está configurado para desplegarse automáticamente usando Docker.

1. Conecta tu repositorio en Render.com
2. Render detectará automáticamente el archivo `render.yaml`
3. El servicio se desplegará automáticamente
