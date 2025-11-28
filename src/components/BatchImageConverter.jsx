import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FolderOpen, X, Loader2, Download, Image as ImageIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { useToast } from './ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import JSZip from 'jszip';

const BatchImageConverter = () => {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputFormat, setOutputFormat] = useState('webp');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [quality, setQuality] = useState(0.92);
  const [processedResults, setProcessedResults] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const { toast } = useToast();

  const handleFolderSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      
      // Filter only image files
      const imageFiles = selectedFiles.filter(file => {
        return file.type.startsWith('image/') || 
               file.name.match(/\.(jpe?g|png|gif|webp|bmp|svg)$/i);
      });
      
      if (imageFiles.length === 0) {
        toast({
          title: 'Sin imágenes',
          description: 'No se encontraron imágenes en la carpeta seleccionada.',
          variant: 'destructive',
        });
        return;
      }
      
      if (imageFiles.length > 400) {
        toast({
          title: 'Demasiadas imágenes',
          description: `Se permite un máximo de 400 imágenes. Se seleccionaron ${imageFiles.length}.`,
          variant: 'destructive',
        });
        return;
      }
      
      setFiles(imageFiles);
      setProcessedResults(null);
      
      toast({
        title: 'Carpeta cargada',
        description: `${imageFiles.length} imagen${imageFiles.length !== 1 ? 'es' : ''} seleccionada${imageFiles.length !== 1 ? 's' : ''}.`,
      });
    }
  };

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const items = event.dataTransfer.items;
    const droppedFiles = [];
    
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          const file = items[i].getAsFile();
          if (file.type.startsWith('image/') || 
              file.name.match(/\.(jpe?g|png|gif|webp|bmp|svg)$/i)) {
            droppedFiles.push(file);
          }
        }
      }
    }
    
    if (droppedFiles.length > 0) {
      if (droppedFiles.length > 400) {
        toast({
          title: 'Demasiadas imágenes',
          description: `Se permite un máximo de 400 imágenes. Se soltaron ${droppedFiles.length}.`,
          variant: 'destructive',
        });
        return;
      }
      
      setFiles(droppedFiles);
      setProcessedResults(null);
      
      toast({
        title: 'Imágenes cargadas',
        description: `${droppedFiles.length} imagen${droppedFiles.length !== 1 ? 'es' : ''} cargada${droppedFiles.length !== 1 ? 's' : ''}.`,
      });
    }
  }, [toast]);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleProcess = async () => {
    if (files.length === 0) {
      toast({
        title: 'Error',
        description: 'Por favor, selecciona imágenes para procesar.',
        variant: 'destructive',
      });
      return;
    }

    // Validate dimensions if provided
    if (width && (!Number(width) || Number(width) <= 0 || Number(width) > 10000)) {
      toast({
        title: 'Error en ancho',
        description: 'El ancho debe ser un número entre 1 y 10000 píxeles.',
        variant: 'destructive',
      });
      return;
    }

    if (height && (!Number(height) || Number(height) <= 0 || Number(height) > 10000)) {
      toast({
        title: 'Error en alto',
        description: 'El alto debe ser un número entre 1 y 10000 píxeles.',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setProgress({ current: 0, total: files.length });

    try {
      toast({
        title: 'Procesando imágenes',
        description: `Procesando ${files.length} imagen${files.length !== 1 ? 'es' : ''}...`,
      });

      // Process images with progress tracking
      const results = [];
      const errors = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress({ current: i + 1, total: files.length });

        try {
          const { convertImage } = await import('../lib/imageConverters');
          
          // Prepare conversion options
          const conversionOptions = {
            quality: quality,
            removeMetadata: true
          };
          
          // Add dimensions if provided
          if (width && height) {
            conversionOptions.width = parseInt(width);
            conversionOptions.height = parseInt(height);
          }
          
          const blob = await convertImage(file, outputFormat, conversionOptions);
          
          // Get file extension from original name
          const originalName = file.name.replace(/\.[^/.]+$/, '');
          const newFileName = `${originalName}.${outputFormat}`;
          
          results.push({
            blob,
            fileName: newFileName,
            originalFileName: file.name,
            size: blob.size,
            index: i
          });
        } catch (error) {
          errors.push({
            fileName: file.name,
            error: error.message,
            index: i
          });
        }
      }

      setProcessedResults({
        results,
        errors,
        totalProcessed: results.length,
        totalErrors: errors.length,
        totalFiles: files.length
      });

      if (errors.length > 0) {
        toast({
          title: 'Procesamiento completado con errores',
          description: `${results.length} imagen${results.length !== 1 ? 'es' : ''} procesada${results.length !== 1 ? 's' : ''}, ${errors.length} error${errors.length !== 1 ? 'es' : ''}.`,
          variant: 'default',
        });
      } else {
        toast({
          title: '¡Procesamiento exitoso!',
          description: `${results.length} imagen${results.length !== 1 ? 'es' : ''} procesada${results.length !== 1 ? 's' : ''} correctamente.`,
        });
      }
    } catch (error) {
      console.error('Error en el procesamiento:', error);
      toast({
        title: 'Error',
        description: error.message || 'Ocurrió un error al procesar las imágenes.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!processedResults || processedResults.results.length === 0) {
      return;
    }

    try {
      toast({
        title: 'Creando ZIP',
        description: 'Empaquetando las imágenes...',
      });

      const zip = new JSZip();
      
      // Add all processed images to the zip
      processedResults.results.forEach((img) => {
        zip.file(img.fileName, img.blob);
      });

      // Generate the zip file
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // Create download link
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `imagenes_convertidas_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      toast({
        title: '¡Descarga iniciada!',
        description: 'El archivo ZIP se ha descargado correctamente.',
      });
    } catch (error) {
      console.error('Error al crear ZIP:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el archivo ZIP.',
        variant: 'destructive',
      });
    }
  };

  const handleClear = () => {
    setFiles([]);
    setProcessedResults(null);
    setProgress({ current: 0, total: 0 });
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <Card className="bg-card backdrop-blur-sm border-2 border-border shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-foreground">
            <FolderOpen className="w-6 h-6 text-primary" />
            Conversión por Lotes de Imágenes
          </CardTitle>
          <CardDescription>
            Procesa hasta 400 imágenes simultáneamente. Convierte a WebP, redimensiona y comprime en lote.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center hover:border-primary transition-colors bg-muted/30"
          >
            <input
              type="file"
              id="file-input"
              multiple
              onChange={handleFolderSelect}
              className="hidden"
              accept="image/*,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg"
            />
            <label htmlFor="file-input" className="cursor-pointer block">
              <UploadCloud className="w-16 h-16 mx-auto text-primary/60 mb-4" />
              <p className="text-lg font-medium text-foreground mb-2">
                Haz clic aquí o arrastra imágenes
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                Puedes seleccionar hasta 400 imágenes
              </p>
              <p className="text-xs text-muted-foreground/70">
                Soporta: JPEG, PNG, GIF, WebP, BMP, SVG
              </p>
            </label>
          </div>

          {/* Files selected */}
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary/10 rounded-lg p-4 border border-primary/20"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">
                  {files.length} imagen{files.length !== 1 ? 'es' : ''} seleccionada{files.length !== 1 ? 's' : ''}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  disabled={isProcessing}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {files.slice(0, 10).map((file, idx) => (
                  <div key={idx} className="text-xs text-muted-foreground flex items-center gap-2">
                    <ImageIcon className="w-3 h-3" />
                    {file.name}
                  </div>
                ))}
                {files.length > 10 && (
                  <p className="text-xs text-muted-foreground italic">
                    ... y {files.length - 10} más
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Formato de salida
              </label>
              <Select value={outputFormat} onValueChange={setOutputFormat}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona formato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webp">WebP (recomendado)</SelectItem>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="gif">GIF</SelectItem>
                  <SelectItem value="bmp">BMP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dimensions */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Dimensiones (opcional)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="Ancho (px)"
                    min="1"
                    max="10000"
                    className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={isProcessing}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Ancho en píxeles</p>
                </div>
                <div>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="Alto (px)"
                    min="1"
                    max="10000"
                    className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={isProcessing}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Alto en píxeles</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Ejemplo: 1920 x 1080 o déjalos vacíos para mantener tamaño original
              </p>
            </div>

            {/* Quality */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Calidad: {Math.round(quality * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.01"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full"
                disabled={isProcessing}
              />
            </div>
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Procesando...</span>
                <span>{progress.current} / {progress.total}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </motion.div>
          )}

          {/* Results */}
          {processedResults && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="font-semibold text-foreground">
                  Procesamiento completado
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Exitosas:</span>
                  <span className="font-semibold text-foreground">{processedResults.totalProcessed}</span>
                </div>
                {processedResults.totalErrors > 0 && (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    <span className="text-muted-foreground">Errores:</span>
                    <span className="font-semibold text-foreground">{processedResults.totalErrors}</span>
                  </div>
                )}
              </div>
              
              {processedResults.errors.length > 0 && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer font-medium">Ver errores</summary>
                  <ul className="mt-2 space-y-1 pl-4">
                    {processedResults.errors.map((err, idx) => (
                      <li key={idx}>• {err.fileName}: {err.error}</li>
                    ))}
                  </ul>
                </details>
              )}
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleProcess}
              disabled={files.length === 0 || isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Procesar Imágenes
                </>
              )}
            </Button>

            {processedResults && processedResults.results.length > 0 && (
              <Button
                onClick={handleDownloadZip}
                variant="outline"
                className="border-green-600 dark:border-green-400 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950"
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar ZIP
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BatchImageConverter;
