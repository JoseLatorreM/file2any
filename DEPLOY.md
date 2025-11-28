# 🚀 Guía de Despliegue - Files2Any

## Arquitectura
- **Frontend**: Hostinger (archivos estáticos)
- **Backend**: Render.com (servidor Node.js con yt-dlp) - **GRATIS**

---

## Paso 1: Desplegar el Backend en Render.com

### 1.1 Crear cuenta
1. Ve a [render.com](https://render.com)
2. Regístrate con tu cuenta de GitHub

### 1.2 Crear el servicio
1. Haz clic en **"New +"** → **"Web Service"**
2. Conecta tu repositorio de GitHub (`file2any`)
3. Configura:
   - **Name**: `file2any-api`
   - **Region**: Oregon (US West) o el más cercano
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Docker`
   - **Instance Type**: `Free`

### 1.3 Variables de entorno (opcional)
En la sección "Environment", agrega:
- `FRONTEND_URL` = `https://files2any.com`

### 1.4 Desplegar
Haz clic en **"Create Web Service"**

Render te dará una URL como: `https://file2any-api.onrender.com`

---

## Paso 2: Actualizar el Frontend

### 2.1 Configurar la URL del API
Edita el archivo `.env.production` y cambia la URL:

```
VITE_API_URL=https://file2any-api.onrender.com
```

(Usa la URL real que te dio Render)

### 2.2 Compilar
```bash
npm run build
```

### 2.3 Subir a Hostinger
Sube el contenido de la carpeta `dist/` a tu hosting en Hostinger.

---

## ⚠️ Limitaciones del Plan Gratuito de Render

| Característica | Detalle |
|----------------|---------|
| Sleep | El servidor se duerme después de 15 min sin uso |
| Wake up | Tarda ~30-50 segundos en despertar |
| Horas/mes | 750 horas gratis (suficiente para 1 servicio 24/7) |
| RAM | 512 MB |
| CPU | 0.1 CPU compartida |

### Mantener el servidor activo (opcional)
Usa [UptimeRobot](https://uptimerobot.com) (gratis) para hacer ping cada 14 minutos:
1. Crea cuenta en UptimeRobot
2. Agrega monitor HTTP(s)
3. URL: `https://file2any-api.onrender.com/health`
4. Intervalo: 14 minutos

---

## 🔧 Comandos Útiles

### Desarrollo local
```bash
# Terminal 1 - Backend
cd server
npm install
npm run dev

# Terminal 2 - Frontend
npm install
npm run dev
```

### Producción
```bash
npm run build
```

---

## 📁 Estructura del Proyecto

```
file2any/
├── server/              # Backend (se despliega en Render)
│   ├── Dockerfile       # Configuración de Docker
│   ├── server.js        # Servidor Express
│   └── package.json
├── src/                 # Frontend (se despliega en Hostinger)
│   └── components/
│       └── YouTubeDownloader.jsx
├── .env.production      # URL del API en producción
└── dist/                # Build de producción (subir a Hostinger)
```
