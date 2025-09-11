import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, File, X, Loader2, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { useToast } from './ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// Importar las funciones de conversión PDF
import { pdfToDocx, pdfToTxt, pdfToMarkdown, extractTextFromPDF } from '../lib/pdfConverters';
// Importar las funciones de conversión DOCX
import { docxToTxt, docxToMarkdown, docxToPdf, DOCX_CONVERSION_OPTIONS } from '../lib/docxConverters';
// Importar las funciones de conversión XLSX
import { xlsxToCsv, xlsxToJson, xlsxToXml, xlsxToPdf, XLSX_CONVERSION_OPTIONS } from '../lib/xlsxConverters';
// Importar las funciones de conversión PPTX
import { pptxToPdf, pptxToImages, pptxToTxt, PPTX_CONVERSION_OPTIONS } from '../lib/pptxConverters';
// Importar las funciones de conversión CSV
import { csvToXlsx, csvToPdf, csvToJson, csvToXml, CSV_CONVERSION_OPTIONS } from '../lib/csvConverters';
// Importar las funciones de conversión JSON
import { jsonToCsv, jsonToXlsx, jsonToXml, JSON_CONVERSION_OPTIONS } from '../lib/jsonConverters';
// Importar las funciones de conversión XML
import { xmlToCsv, xmlToXlsx, xmlToJson, XML_CONVERSION_OPTIONS } from '../lib/xmlConverters';
// Importar las funciones de conversión de imágenes
import { 
  convertImage,
  getImageType,
  getConversionOptions as getImageConversionOptions,
  manipulateImage
} from '../lib/imageConverters';

const FileConverter = () => {
  const [file, setFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [outputFormat, setOutputFormat] = useState(null);
  const [imageOptions, setImageOptions] = useState({
    quality: 0.92,
    resize: false,
    width: null,
    height: null,
    grayscale: false,
    removeMetadata: true
  });
  const { toast } = useToast();

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setOutputFormat(null);
    }
  };

  const handleDrop = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files[0]) {
      setFile(event.dataTransfer.files[0]);
      setOutputFormat(null);
    }
  }, []);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);
  
  const handleConvert = async () => {
    if (!file || !outputFormat) {
      toast({
        title: 'Error',
        description: 'Por favor, selecciona un archivo y un formato de salida.',
        variant: 'destructive',
      });
      return;
    }
    setIsConverting(true);
    
    // Preparar mensaje de toast según el tipo de archivo
    const isImage = file.type.includes('image') || file.name.toLowerCase().match(/\.(jpe?g|png|gif|webp|bmp|svg)$/);
    
    toast({
      title: 'Procesando...',
      description: isImage 
        ? `Convirtiendo imagen a ${outputFormat}${imageOptions.resize ? ' y redimensionando' : ''}...` 
        : `Convirtiendo ${file.name} a ${outputFormat}...`,
    });

    try {
      let blob = null;
      let url = null;
      const fileName = file.name.toLowerCase();
      
      // PDF → TXT
      if (fileName.endsWith('.pdf') && outputFormat === 'TXT') {
        const pdfContent = await extractTextFromPDF(file);
        blob = await pdfToTxt(pdfContent);
        url = URL.createObjectURL(blob);
      }
      // PDF → DOCX
      else if (fileName.endsWith('.pdf') && outputFormat === 'DOCX') {
        const pdfContent = await extractTextFromPDF(file);
        blob = await pdfToDocx(pdfContent);
        url = URL.createObjectURL(blob);
      }
      // PDF → MD
      else if (fileName.endsWith('.pdf') && (outputFormat === 'MD' || outputFormat === 'MARKDOWN')) {
        const pdfContent = await extractTextFromPDF(file);
        blob = await pdfToMarkdown(pdfContent);
        url = URL.createObjectURL(blob);
      }
      // DOCX → TXT
      else if (fileName.endsWith('.docx') && outputFormat === 'TXT') {
        blob = await docxToTxt(file);
        url = URL.createObjectURL(blob);
      }
      // DOCX → MD
      else if (fileName.endsWith('.docx') && (outputFormat === 'MD' || outputFormat === 'MARKDOWN')) {
        blob = await docxToMarkdown(file);
        url = URL.createObjectURL(blob);
      }
      // DOCX → PDF
      else if (fileName.endsWith('.docx') && outputFormat === 'PDF') {
        blob = await docxToPdf(file);
        url = URL.createObjectURL(blob);
      }
      // XLSX → CSV
      else if ((fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) && outputFormat === 'CSV') {
        blob = await xlsxToCsv(file);
        url = URL.createObjectURL(blob);
      }
      // XLSX → JSON
      else if ((fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) && outputFormat === 'JSON') {
        blob = await xlsxToJson(file);
        url = URL.createObjectURL(blob);
      }
      // XLSX → XML
      else if ((fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) && outputFormat === 'XML') {
        blob = await xlsxToXml(file);
        url = URL.createObjectURL(blob);
      }
      // XLSX → PDF
      else if ((fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) && outputFormat === 'PDF') {
        blob = await xlsxToPdf(file);
        url = URL.createObjectURL(blob);
      }

      // PPTX → PDF
      else if (fileName.endsWith('.pptx') && outputFormat === 'PDF') {
        blob = await pptxToPdf(file);
        url = URL.createObjectURL(blob);
      }
      // PPTX → PNG
      else if (fileName.endsWith('.pptx') && outputFormat === 'PNG') {
        const blobs = await pptxToImages(file, 'png');
        // Descargar cada imagen
        blobs.forEach((imgBlob, idx) => {
          const imgUrl = URL.createObjectURL(imgBlob);
          const link = document.createElement('a');
          link.href = imgUrl;
          link.download = `${file.name.replace(/\.pptx$/i, '')}_slide${idx + 1}.png`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          setTimeout(() => URL.revokeObjectURL(imgUrl), 1000);
        });
        toast({
          title: '¡Conversión exitosa!',
          description: `Las diapositivas PNG han sido descargadas.`,
        });
        setIsConverting(false);
        return;
      }
      // PPTX → JPG
      else if (fileName.endsWith('.pptx') && outputFormat === 'JPG') {
        const blobs = await pptxToImages(file, 'jpg');
        blobs.forEach((imgBlob, idx) => {
          const imgUrl = URL.createObjectURL(imgBlob);
          const link = document.createElement('a');
          link.href = imgUrl;
          link.download = `${file.name.replace(/\.pptx$/i, '')}_slide${idx + 1}.jpg`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          setTimeout(() => URL.revokeObjectURL(imgUrl), 1000);
        });
        toast({
          title: '¡Conversión exitosa!',
          description: `Las diapositivas JPG han sido descargadas.`,
        });
        setIsConverting(false);
        return;
      }
      // PPTX → TXT
      else if (fileName.endsWith('.pptx') && outputFormat === 'TXT') {
        blob = await pptxToTxt(file);
        url = URL.createObjectURL(blob);
      }
      // CSV → XLSX
      else if (fileName.endsWith('.csv') && outputFormat === 'XLSX') {
        blob = await csvToXlsx(file);
        url = URL.createObjectURL(blob);
      }
      // CSV → PDF
      else if (fileName.endsWith('.csv') && outputFormat === 'PDF') {
        blob = await csvToPdf(file);
        url = URL.createObjectURL(blob);
      }
      // CSV → JSON
      else if (fileName.endsWith('.csv') && outputFormat === 'JSON') {
        blob = await csvToJson(file);
        url = URL.createObjectURL(blob);
      }
      // CSV → XML
      else if (fileName.endsWith('.csv') && outputFormat === 'XML') {
        blob = await csvToXml(file);
        url = URL.createObjectURL(blob);
      }
      // JSON → CSV
      else if (fileName.endsWith('.json') && outputFormat === 'CSV') {
        blob = await jsonToCsv(file);
        url = URL.createObjectURL(blob);
      }
      // JSON → XLSX
      else if (fileName.endsWith('.json') && outputFormat === 'XLSX') {
        blob = await jsonToXlsx(file);
        url = URL.createObjectURL(blob);
      }
      // JSON → XML
      else if (fileName.endsWith('.json') && outputFormat === 'XML') {
        blob = await jsonToXml(file);
        url = URL.createObjectURL(blob);
      }
      // XML → CSV
      else if (fileName.endsWith('.xml') && outputFormat === 'CSV') {
        blob = await xmlToCsv(file);
        url = URL.createObjectURL(blob);
      }
      // XML → XLSX
      else if (fileName.endsWith('.xml') && outputFormat === 'XLSX') {
        blob = await xmlToXlsx(file);
        url = URL.createObjectURL(blob);
      }
      // XML → JSON
      else if (fileName.endsWith('.xml') && outputFormat === 'JSON') {
        blob = await xmlToJson(file);
        url = URL.createObjectURL(blob);
      }
      // Conversión de imágenes
      else if (
        (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || 
         fileName.endsWith('.png') || fileName.endsWith('.gif') || 
         fileName.endsWith('.webp') || fileName.endsWith('.bmp') || 
         fileName.endsWith('.svg'))
      ) {
        try {
          // Preparar opciones para la conversión de imágenes
          const conversionOptions = {
            quality: imageOptions.quality,
            removeMetadata: imageOptions.removeMetadata,
            grayscale: imageOptions.grayscale
          };
          
          // Añadir opciones de redimensionamiento si están habilitadas
          if (imageOptions.resize && (imageOptions.width || imageOptions.height)) {
            conversionOptions.width = imageOptions.width;
            conversionOptions.height = imageOptions.height;
          }
          
          // Mostrar toast de procesamiento para operaciones que pueden tomar tiempo
          if (imageOptions.resize || outputFormat === 'PDF') {
            toast({
              title: 'Procesando imagen',
              description: 'Esta operación puede tardar unos segundos...'
            });
          }
          
          blob = await convertImage(file, outputFormat.toLowerCase(), conversionOptions);
          url = URL.createObjectURL(blob);
        } catch (error) {
          console.error('Error en conversión de imagen:', error);
          throw new Error(`Error al convertir imagen: ${error.message}`);
        }
      }
      // PDF → Imagen (PNG/JPG)
      else if (fileName.endsWith('.pdf') && (outputFormat === 'PNG' || outputFormat === 'JPG')) {
        const format = outputFormat.toLowerCase();
        const blobs = await pdfToImages(file, format);
        
        // Si hay múltiples páginas, descárgalas individualmente
        if (blobs.length > 1) {
          blobs.forEach((imgBlob, idx) => {
            const imgUrl = URL.createObjectURL(imgBlob);
            const link = document.createElement('a');
            link.href = imgUrl;
            link.download = `${file.name.replace(/\.pdf$/i, '')}_page${idx + 1}.${format}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(imgUrl), 1000);
          });
          toast({
            title: '¡Conversión exitosa!',
            description: `Las imágenes ${format.toUpperCase()} han sido descargadas.`,
          });
          setIsConverting(false);
          return;
        } else if (blobs.length === 1) {
          // Si solo hay una página, continuar con la descarga normal
          blob = blobs[0];
          url = URL.createObjectURL(blob);
        } else {
          throw new Error('No se pudo convertir el PDF a imagen.');
        }
      }
      // No implementado
      else {
        throw new Error('Conversión no implementada para este formato.');
      }

      // Descargar el archivo convertido
      let fileExtension = '';
      if (fileName.endsWith('.pdf')) fileExtension = '.pdf';
      else if (fileName.endsWith('.docx')) fileExtension = '.docx';
      else if (fileName.endsWith('.xlsx')) fileExtension = '.xlsx';
      else if (fileName.endsWith('.xls')) fileExtension = '.xls';
      else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) fileExtension = '.jpg';
      else if (fileName.endsWith('.png')) fileExtension = '.png';
      else if (fileName.endsWith('.gif')) fileExtension = '.gif';
      else if (fileName.endsWith('.webp')) fileExtension = '.webp';
      else if (fileName.endsWith('.bmp')) fileExtension = '.bmp';
      else if (fileName.endsWith('.svg')) fileExtension = '.svg';
      
      const downloadName = file.name.replace(new RegExp(fileExtension + '$', 'i'), `.${outputFormat.toLowerCase()}`);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        blob = null;
      }, 1000);

      toast({
        title: '¡Conversión exitosa!',
        description: `El archivo ${downloadName} ha sido descargado.`,
      });
    } catch (err) {
      toast({
        title: 'Error en la conversión',
        description: err.message,
        variant: 'destructive',
      });
    }
    setIsConverting(false);
  };

  const removeFile = () => {
    setFile(null);
    setOutputFormat(null);
    // Resetear opciones de imagen a valores predeterminados
    setImageOptions({
      quality: 0.92,
      resize: false,
      width: null,
      height: null,
      grayscale: false,
      removeMetadata: true
    });
  };


  // Opciones de conversión para cada formato centralizadas en sus módulos

  const PDF_CONVERSION_OPTIONS = ['DOCX', 'TXT', 'MD', 'PNG', 'JPG'];

  // Opciones de conversión para PPTX
  const PPTX_CONVERSION_OPTIONS = ['PDF', 'PNG', 'JPG', 'TXT'];

  // Opciones de conversión para CSV
  const CSV_CONVERSION_OPTIONS = ['XLSX', 'PDF', 'JSON', 'XML'];

  // Opciones de conversión para JSON
  const JSON_CONVERSION_OPTIONS = ['CSV', 'XLSX', 'XML'];

  // Opciones de conversión para XML
  const XML_CONVERSION_OPTIONS = ['CSV', 'XLSX', 'JSON'];
  
  // Opciones de conversión para imágenes
  const IMAGE_CONVERSION_OPTIONS = {
    jpeg: ['PNG', 'WEBP', 'GIF', 'BMP', 'PDF'],
    jpg: ['PNG', 'WEBP', 'GIF', 'BMP', 'PDF'],
    png: ['JPG', 'WEBP', 'GIF', 'BMP', 'PDF'],
    webp: ['PNG', 'JPG', 'GIF', 'BMP', 'PDF'],
    gif: ['PNG', 'JPG', 'WEBP', 'BMP'],
    bmp: ['PNG', 'JPG', 'WEBP', 'GIF'],
    svg: ['PNG', 'JPG', 'PDF']
  };


  const getFileType = () => {
    if (!file) return [];
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith('.pdf')) return PDF_CONVERSION_OPTIONS;
    if (fileName.endsWith('.docx')) return DOCX_CONVERSION_OPTIONS;
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) return XLSX_CONVERSION_OPTIONS;
    if (fileName.endsWith('.pptx')) return PPTX_CONVERSION_OPTIONS;
    if (fileName.endsWith('.csv')) return CSV_CONVERSION_OPTIONS;
    if (fileName.endsWith('.json')) return JSON_CONVERSION_OPTIONS;
    if (fileName.endsWith('.xml')) return XML_CONVERSION_OPTIONS;
    
    // Detectar formatos de imagen
    if (
      fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') ||
      fileName.endsWith('.png') || fileName.endsWith('.gif') ||
      fileName.endsWith('.bmp') || fileName.endsWith('.webp') ||
      fileName.endsWith('.svg')
    ) {
      // Usar la función getConversionOptions del módulo imageConverters
      const imgType = getImageType(file);
      return getImageConversionOptions(imgType);
    }
    
    return [];
  }

  const possibleConversions = getFileType();

  return (
    <motion.section 
      id="converter" 
      className="w-full max-w-3xl mx-auto py-16 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="shadow-2xl bg-card/80 backdrop-blur-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Conversor de Archivos Universal</CardTitle>
          <CardDescription>Sube tu archivo, elige el formato y convierte. Simple, rápido y seguro.</CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {!file ? (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
              >
                <div 
                  className="border-2 border-dashed border-primary/50 rounded-lg p-8 text-center cursor-pointer hover:bg-accent transition-colors"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  <input 
                    id="file-upload" 
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.docx,.xlsx,.xls,.pptx,.csv,.json,.xml,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg,.tiff,.avif,.ico,.heif"
                    onChange={handleFileChange} 
                  />
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <UploadCloud className="h-12 w-12" />
                    <p className="font-semibold">Arrastra y suelta tu archivo aquí</p>
                    <p className="text-sm">o haz clic para seleccionar</p>
                    <p className="text-xs text-gray-500">Soporta: PDF, DOCX, XLSX, CSV, JSON, XML y formatos de imagen (JPG, PNG, GIF, WEBP, SVG, BMP)</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="file-info"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center gap-6"
              >
                <div className="flex items-center gap-4 bg-secondary p-3 rounded-lg shadow-inner w-full max-w-md">
                  <File className="h-8 w-8 text-primary flex-shrink-0" />
                  <div className="flex-grow overflow-hidden">
                    <p className="font-medium text-sm truncate" title={file.name}>{file.name}</p>
                    <p className="text-muted-foreground text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={removeFile} className="h-8 w-8 flex-shrink-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <motion.div 
                  className="flex items-center justify-center gap-4 w-full"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                >
                  <p className="font-semibold text-lg">Convertir a</p>
                  <ArrowRight className="h-5 w-5 text-muted-foreground"/>
                  <Select onValueChange={setOutputFormat}>
                    <SelectTrigger className="w-[220px] bg-background">
                      <SelectValue placeholder="Selecciona un formato..." />
                    </SelectTrigger>
                    <SelectContent>
                      {possibleConversions.map(format => (
                        <SelectItem key={format} value={format}>{format}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
                
                {/* Mostrar opciones de imagen si se ha seleccionado una imagen */}
                {file && outputFormat && (
                  file.type.includes('image') || file.name.toLowerCase().match(/\.(jpe?g|png|gif|webp|bmp|svg)$/)
                ) && (
                  <motion.div
                    className="w-full mt-4 bg-secondary/50 p-4 rounded-lg shadow-inner"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">Opciones de imagen:</p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <ImageIcon className="h-3 w-3 mr-1" />
                          <span>{file.name}</span>
                        </div>
                      </div>
                      
                      {/* Calidad (para formatos que lo soportan) */}
                      {(outputFormat === 'JPG' || outputFormat === 'JPEG' || outputFormat === 'WEBP') && (
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs text-muted-foreground">
                              Calidad
                            </label>
                            <span className="text-xs font-medium">{Math.round(imageOptions.quality * 100)}%</span>
                          </div>
                          <input 
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.01"
                            value={imageOptions.quality}
                            onChange={(e) => setImageOptions({
                              ...imageOptions,
                              quality: parseFloat(e.target.value)
                            })}
                            className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      )}
                      
                      {/* Opciones de redimensión */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <label className="flex items-center text-xs text-muted-foreground">
                            <input 
                              type="checkbox"
                              checked={imageOptions.resize}
                              onChange={(e) => setImageOptions({
                                ...imageOptions,
                                resize: e.target.checked
                              })}
                              className="mr-2"
                            />
                            Redimensionar
                          </label>
                        </div>
                        
                        {imageOptions.resize && (
                          <div className="flex gap-2 mt-2 p-2 bg-background/50 rounded border border-border/50">
                            <div className="w-1/2">
                              <label className="text-xs text-muted-foreground block mb-1">Ancho:</label>
                              <input
                                type="text"
                                placeholder="px o %"
                                value={imageOptions.width || ''}
                                onChange={(e) => setImageOptions({
                                  ...imageOptions,
                                  width: e.target.value
                                })}
                                className="w-full p-1 text-sm border rounded bg-background"
                              />
                            </div>
                            <div className="w-1/2">
                              <label className="text-xs text-muted-foreground block mb-1">Alto:</label>
                              <input
                                type="text"
                                placeholder="px o %"
                                value={imageOptions.height || ''}
                                onChange={(e) => setImageOptions({
                                  ...imageOptions,
                                  height: e.target.value
                                })}
                                className="w-full p-1 text-sm border rounded bg-background"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Filtros y metadatos */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-background/50 p-2 rounded border border-border/50">
                          <label className="flex items-center text-xs">
                            <input 
                              type="checkbox"
                              checked={imageOptions.grayscale}
                              onChange={(e) => setImageOptions({
                                ...imageOptions,
                                grayscale: e.target.checked
                              })}
                              className="mr-2"
                            />
                            <span>Escala de grises</span>
                          </label>
                        </div>
                        
                        <div className="bg-background/50 p-2 rounded border border-border/50">
                          <label className="flex items-center text-xs">
                            <input 
                              type="checkbox"
                              checked={imageOptions.removeMetadata}
                              onChange={(e) => setImageOptions({
                                ...imageOptions,
                                removeMetadata: e.target.checked
                              })}
                              className="mr-2"
                            />
                            <span>Eliminar metadatos</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 flex justify-center">
            <Button size="lg" onClick={handleConvert} disabled={!file || !outputFormat || isConverting} className="w-full max-w-xs">
              {isConverting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Convirtiendo...
                </>
              ) : (
                'Convertir Archivo'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  );
};

export default FileConverter;