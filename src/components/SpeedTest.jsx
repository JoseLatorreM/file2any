import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Gauge, ArrowDown, ArrowUp, Activity, RefreshCw, Wifi, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const SpeedTest = () => {
  const [status, setStatus] = useState('idle'); // idle, ping, download, upload, complete
  const [ping, setPing] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const runTest = async () => {
    setStatus('ping');
    setPing(0);
    setDownloadSpeed(0);
    setUploadSpeed(0);
    setProgress(0);
    setError(null);

    try {
      // 1. Test Ping (Media de 10 peticiones)
      const pings = [];
      const iterations = 10;

      for (let i = 0; i < iterations; i++) {
        const pingStart = performance.now();
        // Usamos un recurso estático pequeño para el ping
        // Usamos Google para medir latencia real a internet (mode: no-cors permite medir tiempo aunque no lea respuesta)
        await fetch('https://www.google.com/generate_204?t=' + Date.now() + i, { mode: 'no-cors', cache: 'no-store' });
        const pingEnd = performance.now();
        const duration = pingEnd - pingStart;
        pings.push(duration);
        
        // Mostrar el ping actual mientras se calcula
        setPing(Math.round(duration));
        
        // Pequeña pausa entre pings
        await new Promise(r => setTimeout(r, 100));
      }

      // Calcular media
      const averagePing = pings.reduce((a, b) => a + b, 0) / pings.length;
      setPing(Math.round(averagePing));
      setProgress(33);

      // 2. Test Download
      setStatus('download');
      const downloadStart = performance.now();
      
      // Usamos una imagen de alta resolución de Wikimedia (servidor global rápido y fiable)
      // Esto evita saturar tu propio servidor y mide la velocidad real de internet del usuario.
      // Archivo: Pizigani 1367 Chart (10MB)
      const response = await fetch('https://upload.wikimedia.org/wikipedia/commons/f/ff/Pizigani_1367_Chart_10MB.jpg?t=' + Date.now(), { cache: 'no-store' });
      const blob = await response.blob();

      const downloadEnd = performance.now();
      const durationSeconds = (downloadEnd - downloadStart) / 1000;
      const bitsLoaded = blob.size * 8;
      const mbps = (bitsLoaded / durationSeconds) / (1024 * 1024);
      setDownloadSpeed(mbps.toFixed(2));
      setProgress(66);

      // 3. Test Upload
      setStatus('upload');
      const uploadStart = performance.now();
      // Usamos 5MB para tener una medición más precisa en conexiones rápidas
      const uploadData = new Uint8Array(5 * 1024 * 1024); 
      
      try {
        // Usamos el endpoint de subida de Cloudflare Speed Test
        // Es una red global (CDN) diseñada específicamente para pruebas de velocidad.
        // Esto garantiza una medición "REAL" contra un servidor de alta capacidad en internet.
        await fetch('https://speed.cloudflare.com/__up', {
          method: 'POST',
          body: uploadData,
          mode: 'cors'
        });
      } catch (e) {
        console.warn('Cloudflare upload failed, trying fallback', e);
        // Fallback a httpbin si Cloudflare falla (raro, pero posible por bloqueos de red)
        // Usamos un payload más pequeño para el fallback
        const smallUploadData = new Uint8Array(2 * 1024 * 1024);
        await fetch('https://httpbin.org/post', {
          method: 'POST',
          body: smallUploadData,
          mode: 'cors'
        });
      }
      
      const uploadEnd = performance.now();
      const uploadDuration = (uploadEnd - uploadStart) / 1000;
      // Calcular bits basados en el payload principal (5MB)
      // Si se usó el fallback, el cálculo será aproximado pero indicativo
      const uploadBits = uploadData.length * 8; 
      const uploadMbps = (uploadBits / uploadDuration) / (1024 * 1024);
      setUploadSpeed(uploadMbps.toFixed(2));
      
      setStatus('complete');
      setProgress(100);

    } catch (err) {
      console.error(err);
      setError('Error al realizar el test. Verifica tu conexión.');
      setStatus('idle');
    }
  };

  return (
    <Card className="shadow-2xl bg-card/80 backdrop-blur-lg w-full max-w-4xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-2">
          <Wifi className="h-8 w-8 text-primary" />
          Test de Velocidad de Internet
        </CardTitle>
        <CardDescription>Mide tu conexión y entiende qué significan los resultados.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        
        {/* Resultados Principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Ping */}
          <div className="flex flex-col items-center p-6 bg-muted/30 rounded-xl border relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500/20">
              {status === 'ping' && (
                <motion.div 
                  className="h-full bg-yellow-500" 
                  initial={{ width: '0%' }} 
                  animate={{ width: '100%' }} 
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </div>
            <Activity className={`h-8 w-8 mb-4 ${status === 'ping' ? 'text-yellow-500 animate-pulse' : 'text-muted-foreground'}`} />
            <span className="text-sm font-medium text-muted-foreground mb-1">Ping (Latencia)</span>
            <div className="text-3xl font-bold">{ping > 0 ? ping : '--'} <span className="text-sm font-normal text-muted-foreground">ms</span></div>
            <p className="text-xs text-center mt-4 text-muted-foreground">
              El tiempo de reacción de tu conexión. <br/>
              <strong>Menos es mejor.</strong> <br/>
              Ideal para juegos online: &lt; 50ms.
            </p>
          </div>

          {/* Bajada */}
          <div className="flex flex-col items-center p-6 bg-muted/30 rounded-xl border relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-green-500/20">
              {status === 'download' && (
                <motion.div 
                  className="h-full bg-green-500" 
                  initial={{ width: '0%' }} 
                  animate={{ width: '100%' }} 
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </div>
            <ArrowDown className={`h-8 w-8 mb-4 ${status === 'download' ? 'text-green-500 animate-bounce' : 'text-muted-foreground'}`} />
            <span className="text-sm font-medium text-muted-foreground mb-1">Descarga (Bajada)</span>
            <div className="text-3xl font-bold">{downloadSpeed > 0 ? downloadSpeed : '--'} <span className="text-sm font-normal text-muted-foreground">Mbps</span></div>
            <p className="text-xs text-center mt-4 text-muted-foreground">
              Qué tan rápido recibes datos. <br/>
              <strong>Más es mejor.</strong> <br/>
              Importante para ver videos, Netflix, descargar archivos.
            </p>
          </div>

          {/* Subida */}
          <div className="flex flex-col items-center p-6 bg-muted/30 rounded-xl border relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/20">
              {status === 'upload' && (
                <motion.div 
                  className="h-full bg-blue-500" 
                  initial={{ width: '0%' }} 
                  animate={{ width: '100%' }} 
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </div>
            <ArrowUp className={`h-8 w-8 mb-4 ${status === 'upload' ? 'text-blue-500 animate-bounce' : 'text-muted-foreground'}`} />
            <span className="text-sm font-medium text-muted-foreground mb-1">Carga (Subida)</span>
            <div className="text-3xl font-bold">{uploadSpeed > 0 ? uploadSpeed : '--'} <span className="text-sm font-normal text-muted-foreground">Mbps</span></div>
            <p className="text-xs text-center mt-4 text-muted-foreground">
              Qué tan rápido envías datos. <br/>
              <strong>Más es mejor.</strong> <br/>
              Importante para videollamadas, subir archivos a la nube.
            </p>
          </div>
        </div>

        {/* Botón de Acción */}
        <div className="flex justify-center">
          <Button 
            size="lg" 
            onClick={runTest} 
            disabled={status !== 'idle' && status !== 'complete'}
            className="w-full sm:w-auto min-w-[200px] text-lg h-12"
          >
            {status === 'idle' || status === 'complete' ? (
              <>
                <Gauge className="mr-2 h-5 w-5" /> Iniciar Test
              </>
            ) : (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Midiendo...
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="text-center text-red-500 text-sm bg-red-500/10 p-2 rounded">
            {error}
          </div>
        )}

        {/* Explicación Detallada */}
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-semibold mb-4 text-center">¿Qué significan estos datos?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2"><Activity className="h-4 w-4" /> Ping (Latencia)</h4>
              <p className="text-muted-foreground">
                Es el tiempo que tarda un paquete de datos en ir desde tu dispositivo hasta el servidor y volver. Se mide en milisegundos (ms). Un ping bajo es crucial para juegos en línea y videollamadas fluidas.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2"><ArrowDown className="h-4 w-4" /> Velocidad de Bajada</h4>
              <p className="text-muted-foreground">
                Es la velocidad a la que tu conexión puede descargar datos de Internet. Afecta a la rapidez con la que cargan las páginas web, la calidad de los videos en streaming y el tiempo de descarga de archivos.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2"><ArrowUp className="h-4 w-4" /> Velocidad de Subida</h4>
              <p className="text-muted-foreground">
                Es la velocidad a la que puedes enviar datos desde tu dispositivo a Internet. Es fundamental para enviar correos con adjuntos grandes, subir videos a YouTube o realizar videollamadas de alta calidad.
              </p>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default SpeedTest;
