import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Loader2, Youtube, CheckCircle2, AlertCircle, Info, Video, Music } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { useToast } from './ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const YouTubeDownloader = () => {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState('highest');
  const [downloadType, setDownloadType] = useState('video');
  const { toast } = useToast();

  // URL del backend: en desarrollo usa proxy local, en producción usa Render
  // IMPORTANTE: Después de desplegar en Render, reemplaza la URL con la tuya
  const API_URL = import.meta.env.DEV 
    ? '' // En desarrollo, Vite proxy redirige a localhost:3001
    : (import.meta.env.VITE_API_URL || 'https://file2any-api.onrender.com');

  const validateYouTubeUrl = (url) => {
    const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[a-zA-Z0-9_-]{11}/;
    return pattern.test(url);
  };

  const handleGetVideoInfo = async () => {
    if (!url.trim()) {
      toast({
        title: 'Error',
        description: 'Por favor, ingresa un enlace de YouTube.',
        variant: 'destructive',
      });
      return;
    }

    if (!validateYouTubeUrl(url)) {
      toast({
        title: 'URL Inválida',
        description: 'Por favor, ingresa un enlace válido de YouTube.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoadingInfo(true);
    setVideoInfo(null);

    try {
      const response = await fetch(`${API_URL}/api/youtube/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al obtener información del video');
      }

      const data = await response.json();
      setVideoInfo(data);
      
      toast({
        title: 'Video encontrado',
        description: `"${data.title}" está listo para descargar.`,
      });
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo obtener la información del video.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const handleDownload = async () => {
    if (!videoInfo) {
      toast({
        title: 'Error',
        description: 'Primero debes obtener la información del video.',
        variant: 'destructive',
      });
      return;
    }

    setIsDownloading(true);

    try {
      const response = await fetch(`${API_URL}/api/youtube/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          quality: downloadType === 'audio' ? 'audio' : selectedQuality,
          format: downloadType === 'audio' ? 'mp3' : 'mp4',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al descargar el video');
      }

      // Obtener el blob y crear un enlace de descarga
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${videoInfo.title.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_')}.${downloadType === 'audio' ? 'mp3' : 'mp4'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      toast({
        title: 'Descarga completada',
        description: `El ${downloadType === 'audio' ? 'audio' : 'video'} se ha descargado exitosamente.`,
      });
    } catch (error) {
      console.error('Error al descargar:', error);
      toast({
        title: 'Error en la descarga',
        description: error.message || 'No se pudo descargar el video.',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = (bytes / (1024 * 1024)).toFixed(2);
    return `${mb} MB`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-2 border-red-200 dark:border-red-900 shadow-lg dark:bg-gray-800">
          <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-red-500 rounded-lg">
                <Youtube className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl dark:text-white">Descargador de YouTube</CardTitle>
                <CardDescription className="dark:text-gray-300">
                  Descarga videos de YouTube en diferentes calidades y formatos
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* Input de URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Enlace del video de YouTube
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 dark:focus:ring-red-900 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleGetVideoInfo();
                    }
                  }}
                />
                <Button
                  onClick={handleGetVideoInfo}
                  disabled={isLoadingInfo}
                  className="bg-red-500 hover:bg-red-600 text-white px-6"
                >
                  {isLoadingInfo ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    <>
                      <Info className="w-4 h-4 mr-2" />
                      Buscar
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pega el enlace completo del video de YouTube que deseas descargar
              </p>
            </div>

            {/* Información del video */}
            <AnimatePresence>
              {videoInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  {/* Preview del video */}
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-gray-200 dark:border-gray-600">
                    <div className="flex space-x-4">
                      {videoInfo.thumbnail && (
                        <img
                          src={videoInfo.thumbnail}
                          alt={videoInfo.title}
                          className="w-40 h-24 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1 space-y-1">
                        <h3 className="font-semibold text-gray-800 dark:text-white line-clamp-2">
                          {videoInfo.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{videoInfo.author}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Duración: {formatDuration(parseInt(videoInfo.lengthSeconds || videoInfo.duration || 0))}
                          {videoInfo.viewCount && ` • ${videoInfo.viewCount.toLocaleString()} vistas`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Opciones de descarga */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Tipo de descarga */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Tipo de descarga
                      </label>
                      <Select value={downloadType} onValueChange={setDownloadType}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">
                            <div className="flex items-center space-x-2">
                              <Video className="w-4 h-4" />
                              <span>Video (MP4)</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="audio">
                            <div className="flex items-center space-x-2">
                              <Music className="w-4 h-4" />
                              <span>Solo Audio (MP3)</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Calidad (solo para video) */}
                    {downloadType === 'video' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Calidad del video
                        </label>
                        <Select value={selectedQuality} onValueChange={setSelectedQuality}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="highest">
                              Máxima calidad disponible
                            </SelectItem>
                            <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                            <SelectItem value="720p">720p (HD)</SelectItem>
                            <SelectItem value="480p">480p (SD)</SelectItem>
                            <SelectItem value="360p">360p (Baja)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {/* Botón de descarga */}
                  <Button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-6 text-lg"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Descargando...
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 mr-2" />
                        Descargar {downloadType === 'audio' ? 'Audio' : 'Video'}
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default YouTubeDownloader;
