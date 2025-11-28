FROM node:20-slim

# Instalar dependencias del sistema necesarias
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalar yt-dlp (se actualiza automáticamente)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

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
