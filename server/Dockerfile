FROM node:20-slim

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Instalar yt-dlp usando pip (más confiable que el binario)
RUN pip3 install --no-cache-dir --break-system-packages yt-dlp

# Verificar que yt-dlp está instalado correctamente
RUN yt-dlp --version

# Crear directorio de trabajo
WORKDIR /app

# Copiar package.json primero (para cache de Docker)
COPY package*.json ./

# Instalar dependencias de Node.js
RUN npm install --omit=dev

# Copiar código del servidor
COPY . .

# Puerto que usa Render
EXPOSE 10000

# Variables de entorno
ENV NODE_ENV=production

# Comando de inicio
CMD ["node", "server.js"]
