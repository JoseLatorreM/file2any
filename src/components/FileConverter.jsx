import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, File, X, Loader2, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { useToast } from './ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// Importar las funciones de conversión PDF
import { pdfToDocx, pdfToTxt, pdfToMarkdown } from '../lib/pdfConverters';
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
// Importar las funciones de conversión de audio
import {
  convertAudio,
  getAudioType,
  getConversionOptions as getAudioConversionOptions,
  AUDIO_CONVERSION_OPTIONS
} from '../lib/audioConverters';
// Importar las funciones de conversión de modelos 3D
import {
  convertModel3D,
  isModel3DFile,
  getModel3DType,
  getModel3DConversionOptions,
  MODEL_3D_CONVERSION_OPTIONS
} from '../lib/model3dConverters';

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
  const [audioOptions, setAudioOptions] = useState({
    bitrate: 192,
    sampleRate: 44100,
    channels: 2,
    normalize: false
  });
  const { toast } = useToast();

  // Verificar si es un archivo de imagen
  const isImage = file && (
    file.type.includes('image') || 
    file.name.toLowerCase().match(/\.(jpe?g|png|gif|webp|bmp|svg)$/)
  );
  
  // Verificar si es un archivo de audio
  const isAudio = file && (
    file.type.includes('audio') || 
    file.name.toLowerCase().match(/\.(mp3|wav|ogg|flac|aac|m4a|opus|wma|aiff)$/)
  );

  // Verificar si es un archivo de modelo 3D
  const isModel3D = file && isModel3DFile(file);

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
    
    toast({
      title: 'Procesando...',
      description: isImage 
        ? `Convirtiendo imagen a ${outputFormat}${imageOptions.resize ? ' y redimensionando' : ''}...`
        : isAudio
        ? `Convirtiendo audio a ${outputFormat}${audioOptions.normalize ? ' y normalizando' : ''}...`
        : `Convirtiendo ${file.name} a ${outputFormat}...`,
    });

    try {
      let blob = null;
      let url = null;
      const fileName = file.name.toLowerCase();
      
      // PDF → TXT
      if (fileName.endsWith('.pdf') && outputFormat === 'TXT') {
        console.log('Convirtiendo PDF a TXT con preservación de estructura...');
        blob = await pdfToTxt(file);
        url = URL.createObjectURL(blob);
      }
      // PDF → DOCX
      else if (fileName.endsWith('.pdf') && outputFormat === 'DOCX') {
        console.log('Convirtiendo PDF a DOCX con preservación de formato...');
        blob = await pdfToDocx(file);
        url = URL.createObjectURL(blob);
      }
      // PDF → MD
      else if (fileName.endsWith('.pdf') && (outputFormat === 'MD' || outputFormat === 'MARKDOWN')) {
        console.log('Convirtiendo PDF a Markdown con preservación de estructura...');
        blob = await pdfToMarkdown(file);
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
      // Conversión de audio
      else if (
        (fileName.endsWith('.mp3') || fileName.endsWith('.wav') || 
         fileName.endsWith('.flac') || fileName.endsWith('.aac') || 
         fileName.endsWith('.ogg') || fileName.endsWith('.opus') || 
         fileName.endsWith('.m4a') || fileName.endsWith('.wma') || 
         fileName.endsWith('.aiff'))
      ) {
        try {
          // Preparar opciones para la conversión de audio
          const conversionOptions = {
            bitrate: audioOptions.bitrate,
            sampleRate: audioOptions.sampleRate,
            channels: audioOptions.channels,
            normalize: audioOptions.normalize
          };
          
          // Mostrar toast específico para cada formato
          const formatMessages = {
            'mp3': 'Comprimiendo con codificación MP3...',
            'ogg': 'Comprimiendo con codificación OGG Vorbis...',
            'm4a': 'Comprimiendo con codificación AAC/M4A...',
            'aac': 'Comprimiendo con codificación AAC...',
            'flac': 'Comprimiendo con codificación FLAC sin pérdida...',
            'wav': 'Convirtiendo a formato WAV sin compresión...'
          };
          
          toast({
            title: 'Procesando audio',
            description: formatMessages[outputFormat.toLowerCase()] || 'Procesando conversión de audio...'
          });
          
          // Usar la función real de conversión de audio
          blob = await convertAudio(file, outputFormat.toLowerCase(), conversionOptions);
          url = URL.createObjectURL(blob);
        } catch (error) {
          console.error('Error en conversión de audio:', error);
          toast({
            title: 'Error en la conversión',
            description: `No se pudo procesar el archivo de audio: ${error.message}`,
            variant: 'destructive',
          });
          setIsConverting(false);
          return;
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
      // Conversión de modelos 3D (OBJ ↔ STL)
      else if (fileName.endsWith('.obj') || fileName.endsWith('.stl')) {
        try {
          toast({
            title: 'Procesando modelo 3D',
            description: `Convirtiendo a ${outputFormat}...`
          });
          
          blob = await convertModel3D(file, outputFormat.toLowerCase());
          url = URL.createObjectURL(blob);
        } catch (error) {
          console.error('Error en conversión de modelo 3D:', error);
          toast({
            title: 'Error en la conversión',
            description: `No se pudo convertir el modelo 3D: ${error.message}`,
            variant: 'destructive',
          });
          setIsConverting(false);
          return;
        }
      }
      // No implementado
      else {
        throw new Error('Conversión no implementada para este formato.');
      }

      // Descargar el archivo convertido
      let fileExtension = '';
      let targetExtension = '';
      
      // Detectar extensión original
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
      // Extensiones de audio
      else if (fileName.endsWith('.mp3')) fileExtension = '.mp3';
      else if (fileName.endsWith('.wav')) fileExtension = '.wav';
      else if (fileName.endsWith('.flac')) fileExtension = '.flac';
      else if (fileName.endsWith('.aac')) fileExtension = '.aac';
      else if (fileName.endsWith('.ogg')) fileExtension = '.ogg';
      else if (fileName.endsWith('.opus')) fileExtension = '.opus';
      else if (fileName.endsWith('.m4a')) fileExtension = '.m4a';
      else if (fileName.endsWith('.wma')) fileExtension = '.wma';
      else if (fileName.endsWith('.aiff')) fileExtension = '.aiff';
      // Extensiones de modelos 3D
      else if (fileName.endsWith('.obj')) fileExtension = '.obj';
      else if (fileName.endsWith('.stl')) fileExtension = '.stl';
      
      // Determinar extensión objetivo con mapeo correcto
      const formatExtensionMap = {
        'wav': '.wav',
        'mp3': '.mp3',
        'ogg': '.ogg',
        'm4a': '.m4a',
        'aac': '.aac',
        'flac': '.flac',
        'opus': '.opus',
        'wma': '.wma',
        'aiff': '.aiff',
        'png': '.png',
        'jpg': '.jpg',
        'jpeg': '.jpg',
        'gif': '.gif',
        'webp': '.webp',
        'bmp': '.bmp',
        'svg': '.svg',
        'pdf': '.pdf',
        'docx': '.docx',
        'xlsx': '.xlsx',
        'xml': '.xml',
        'json': '.json',
        'csv': '.csv',
        'obj': '.obj',
        'stl': '.stl'
      };
      
      targetExtension = formatExtensionMap[outputFormat.toLowerCase()] || `.${outputFormat.toLowerCase()}`;
      
      const downloadName = file.name.replace(new RegExp(fileExtension + '$', 'i'), targetExtension);
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

      // Calcular información sobre el archivo
      const originalSize = file.size;
      const newSize = blob?.size || 0;
      const compressionRatio = originalSize > 0 ? ((originalSize - newSize) / originalSize * 100).toFixed(1) : 0;
      
      // Mensaje personalizado según el formato
      let successMessage = `El archivo ${downloadName} ha sido descargado.`;
      if (isAudio && newSize > 0 && originalSize !== newSize) {
        if (newSize < originalSize) {
          successMessage = `Archivo comprimido y descargado. Reducción: ${compressionRatio}% (${(originalSize/1024/1024).toFixed(1)}MB → ${(newSize/1024/1024).toFixed(1)}MB)`;
        } else {
          successMessage = `Archivo convertido y descargado. Tamaño: ${(newSize/1024/1024).toFixed(1)}MB`;
        }
      }

      toast({
        title: '¡Conversión exitosa!',
        description: successMessage,
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
    // Resetear opciones de audio a valores predeterminados
    setAudioOptions({
      bitrate: 192,
      sampleRate: 44100,
      channels: 2,
      normalize: false
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
  
  // Opciones de conversión para audio
  const AUDIO_CONVERSION_OPTIONS = {
    mp3: ['WAV', 'OGG', 'M4A', 'AAC'],
    wav: ['MP3', 'FLAC', 'OGG', 'M4A', 'AAC', 'AIFF'],
    flac: ['MP3', 'WAV', 'OGG', 'M4A', 'AAC'],
    aac: ['MP3', 'WAV', 'OGG', 'M4A'],
    ogg: ['MP3', 'WAV', 'M4A', 'AAC'],
    opus: ['MP3', 'WAV', 'OGG', 'M4A', 'AAC'],
    m4a: ['MP3', 'WAV', 'OGG', 'AAC'],
    wma: ['MP3', 'WAV', 'OGG', 'M4A'],
    aiff: ['MP3', 'WAV', 'FLAC', 'M4A']
  };

  // Opciones de conversión para modelos 3D
  const MODEL_3D_OPTIONS = {
    obj: ['STL'],
    stl: ['OBJ']
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
    
    // Detectar formatos de audio
    if (
      fileName.endsWith('.mp3') || fileName.endsWith('.wav') ||
      fileName.endsWith('.flac') || fileName.endsWith('.aac') ||
      fileName.endsWith('.ogg') || fileName.endsWith('.opus') ||
      fileName.endsWith('.m4a') || fileName.endsWith('.wma') ||
      fileName.endsWith('.aiff')
    ) {
      // Usar la función getConversionOptions del módulo audioConverters
      const audioType = getAudioType(file);
      return getAudioConversionOptions(audioType);
    }
    
    // Detectar formatos de modelos 3D
    if (fileName.endsWith('.obj') || fileName.endsWith('.stl')) {
      const ext = fileName.split('.').pop();
      return MODEL_3D_OPTIONS[ext] || [];
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
                    accept=".pdf,.docx,.xlsx,.xls,.pptx,.csv,.json,.xml,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg,.tiff,.avif,.ico,.heif,.mp3,.wav,.flac,.aac,.ogg,.opus,.m4a,.wma,.aiff"
                    onChange={handleFileChange} 
                  />
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <UploadCloud className="h-12 w-12" />
                    <p className="font-semibold">Arrastra y suelta tu archivo aquí</p>
                    <p className="text-sm">o haz clic para seleccionar</p>
                    <p className="text-xs text-muted-foreground mt-2">Soporta: PDF, DOCX, XLSX, CSV, JSON, XML, imágenes (JPG, PNG, etc) y audio (MP3, WAV, etc)</p>
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
                {file && outputFormat && isImage && (
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
                
                {/* Mostrar opciones de audio si se ha seleccionado un audio */}
                {file && outputFormat && isAudio && (
                  <motion.div
                    className="w-full mt-4 bg-secondary/50 p-4 rounded-lg shadow-inner"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.4 }}
                  >
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-sm">Opciones de audio:</p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 4L14 8H19L15 11L16 15L12 13L8 15L9 11L5 8H10L12 4Z" stroke="currentColor" strokeWidth="2" />
                            <path d="M9 17C9 17.7956 9.31607 18.5587 9.87868 19.1213C10.4413 19.6839 11.2044 20 12 20C12.7956 20 13.5587 19.6839 14.1213 19.1213C14.6839 18.5587 15 17.7956 15 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          <span>{file.name}</span>
                        </div>
                      </div>
                      
                      {/* Bitrate (para formatos lossy) */}
                      {(outputFormat === 'MP3' || outputFormat === 'AAC' || outputFormat === 'OGG') && (
                        <div className="mb-4">
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs text-muted-foreground">
                              Bitrate
                            </label>
                            <span className="text-xs font-medium">{audioOptions.bitrate} kbps</span>
                          </div>
                          <select
                            value={audioOptions.bitrate}
                            onChange={(e) => setAudioOptions({
                              ...audioOptions,
                              bitrate: parseInt(e.target.value)
                            })}
                            className="w-full p-2 text-sm bg-background border rounded"
                          >
                            <option value="128">128 kbps</option>
                            <option value="192">192 kbps</option>
                            <option value="256">256 kbps</option>
                            <option value="320">320 kbps</option>
                          </select>
                        </div>
                      )}
                      
                      {/* Tasa de muestreo */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs text-muted-foreground">
                            Tasa de muestreo
                          </label>
                          <span className="text-xs font-medium">{audioOptions.sampleRate / 1000} kHz</span>
                        </div>
                        <select
                          value={audioOptions.sampleRate}
                          onChange={(e) => setAudioOptions({
                            ...audioOptions,
                            sampleRate: parseInt(e.target.value)
                          })}
                          className="w-full p-2 text-sm bg-background border rounded"
                        >
                          <option value="44100">44.1 kHz (estándar CD)</option>
                          <option value="48000">48 kHz (profesional)</option>
                          <option value="96000">96 kHz (alta definición)</option>
                        </select>
                      </div>
                      
                      {/* Canales */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-xs text-muted-foreground">
                            Canales
                          </label>
                          <span className="text-xs font-medium">{audioOptions.channels === 1 ? 'Mono' : 'Estéreo'}</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setAudioOptions({...audioOptions, channels: 2})}
                            className={`w-1/2 py-1 rounded text-sm border ${audioOptions.channels === 2 ? 'bg-primary text-white' : 'bg-background'}`}
                          >
                            Estéreo
                          </button>
                          <button
                            onClick={() => setAudioOptions({...audioOptions, channels: 1})}
                            className={`w-1/2 py-1 rounded text-sm border ${audioOptions.channels === 1 ? 'bg-primary text-white' : 'bg-background'}`}
                          >
                            Mono
                          </button>
                        </div>
                      </div>
                      
                      {/* Opciones adicionales */}
                      <div className="grid grid-cols-1 gap-2">
                        <div className="bg-background/50 p-2 rounded border border-border/50">
                          <label className="flex items-center text-xs">
                            <input 
                              type="checkbox"
                              checked={audioOptions.normalize}
                              onChange={(e) => setAudioOptions({
                                ...audioOptions,
                                normalize: e.target.checked
                              })}
                              className="mr-2"
                            />
                            <span>Normalizar volumen</span>
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