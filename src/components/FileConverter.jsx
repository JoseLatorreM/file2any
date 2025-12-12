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
import { hashText, verifyHash, HASH_ALGORITHMS, HASH_OUTPUT_FORMATS } from '../lib/hashUtils';

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
  const [model3DOptions, setModel3DOptions] = useState({
    optimization: 'normal' // 'normal', 'optimized', 'performance'
  });
  const [hashInput, setHashInput] = useState('');
  const [hashAlgorithm, setHashAlgorithm] = useState('SHA-256');
  const [hashFormat, setHashFormat] = useState('hex');
  const [hashResult, setHashResult] = useState('');
  const [hashCompareValue, setHashCompareValue] = useState('');
  const [isHashingText, setIsHashingText] = useState(false);
  const [isVerifyingHash, setIsVerifyingHash] = useState(false);
  const [hashStatus, setHashStatus] = useState(null);
  const [hashTheme, setHashTheme] = useState('light'); // 'dark' | 'light'
  const [activeTool, setActiveTool] = useState('files');
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
      // Conversión de modelos 3D (OBJ, STL, 3MF, AMF)
      else if (fileName.endsWith('.obj') || fileName.endsWith('.stl') || 
               fileName.endsWith('.3mf') || fileName.endsWith('.amf')) {
        try {
          const inputFormat = fileName.split('.').pop().toUpperCase();
          toast({
            title: 'Procesando modelo 3D',
            description: `Convirtiendo ${inputFormat} a ${outputFormat}...`
          });
          
          blob = await convertModel3D(file, outputFormat.toLowerCase(), {
            optimization: model3DOptions.optimization
          });
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
      else if (fileName.endsWith('.3mf')) fileExtension = '.3mf';
      else if (fileName.endsWith('.amf')) fileExtension = '.amf';
      
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
        'stl': '.stl',
        '3mf': '.3mf',
        'amf': '.amf'
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

  const handleGenerateHash = () => {
    if (!hashInput.length) {
      toast({
        title: 'Texto requerido',
        description: 'Ingresa el texto que deseas convertir a hash.',
        variant: 'destructive',
      });
      return;
    }
    setIsHashingText(true);
    setHashStatus(null);
    try {
      const result = hashText(hashInput, hashAlgorithm, hashFormat);
      setHashResult(result);
      toast({
        title: 'Hash generado',
        description: 'El texto se ha convertido exitosamente.',
      });
    } catch (error) {
      toast({
        title: 'Error al generar hash',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsHashingText(false);
    }
  };

  const handleCopyHash = async () => {
    if (!hashResult) {
      toast({
        title: 'Nada para copiar',
        description: 'Genera primero un hash para poder copiarlo.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(hashResult);
      toast({
        title: 'Hash copiado',
        description: 'El hash se copió al portapapeles.',
      });
    } catch (error) {
      toast({
        title: 'No se pudo copiar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleVerifyHash = () => {
    if (!hashInput.length) {
      toast({
        title: 'Texto requerido',
        description: 'Necesitas el texto original para verificar un hash.',
        variant: 'destructive',
      });
      return;
    }
    if (!hashCompareValue.trim()) {
      toast({
        title: 'Hash requerido',
        description: 'Pega el hash que quieres comparar.',
        variant: 'destructive',
      });
      return;
    }
    setIsVerifyingHash(true);
    setHashStatus(null);
    try {
      const matches = verifyHash(hashInput, hashCompareValue, hashAlgorithm, hashFormat);
      setHashStatus({
        variant: matches ? 'success' : 'warning',
        message: matches ? 'El hash coincide con el texto ingresado.' : 'El hash NO coincide con el texto proporcionado.'
      });
      toast({
        title: matches ? 'Coincidencia encontrada' : 'No coincide',
        description: matches ? 'El hash y el texto corresponden.' : 'El hash no corresponde con el texto actual.',
        variant: matches ? 'default' : 'destructive',
      });
    } catch (error) {
      setHashStatus({ variant: 'error', message: error.message });
      toast({
        title: 'Error al verificar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsVerifyingHash(false);
    }
  };

  const handleResetHashFields = () => {
    setHashInput('');
    setHashResult('');
    setHashCompareValue('');
    setHashStatus(null);
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
    obj: ['STL', '3MF', 'AMF'],
    stl: ['OBJ', '3MF', 'AMF'],
    '3mf': ['OBJ', 'STL', 'AMF'],
    amf: ['OBJ', 'STL', '3MF']
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
    if (fileName.endsWith('.obj') || fileName.endsWith('.stl') || 
        fileName.endsWith('.3mf') || fileName.endsWith('.amf')) {
      const ext = fileName.split('.').pop();
      return MODEL_3D_OPTIONS[ext] || [];
    }
    
    return [];
  }

  const possibleConversions = getFileType();
  const isHashDark = hashTheme === 'dark';
  const hashCardClasses = isHashDark
    ? 'shadow-2xl border border-white/10 bg-gradient-to-b from-[#040a17] via-[#0b162a] to-[#040a17] text-white'
    : 'shadow-2xl bg-card/80 backdrop-blur-lg';
  const hashLabelClass = `text-sm font-medium ${isHashDark ? 'text-white/80' : ''}`;
  const hashSubLabelClass = `text-sm ${isHashDark ? 'text-white/70' : 'text-muted-foreground'}`;
  const hashTextareaClass = `w-full min-h-[140px] p-3 rounded-md border text-sm focus:outline-none resize-none ${
    isHashDark
      ? 'border-white/10 bg-[#0f1b2f] text-white placeholder-white/40 focus:ring-2 focus:ring-white/30'
      : 'border border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/40'
  }`;
  const hashSmallTextareaClass = `flex-1 min-h-[110px] p-3 rounded-md border text-sm focus:outline-none resize-none ${
    isHashDark
      ? 'border-white/10 bg-[#0f1b2f] text-white placeholder-white/40'
      : 'border border-input bg-muted/40 text-foreground'
  }`;
  const hashHelperTextClass = `text-xs ${isHashDark ? 'text-white/70' : 'text-muted-foreground'}`;
  const getHashStatusClass = (variant) => {
    if (isHashDark) {
      if (variant === 'success') return 'border-emerald-400/70 bg-emerald-500/10 text-emerald-200';
      if (variant === 'warning') return 'border-amber-400/70 bg-amber-500/10 text-amber-200';
      return 'border-red-500/70 bg-red-500/10 text-red-200';
    }
    if (variant === 'success') return 'border-emerald-500 bg-emerald-500/10 text-emerald-600';
    if (variant === 'warning') return 'border-amber-500 bg-amber-500/10 text-amber-600';
    return 'border-destructive bg-destructive/10 text-destructive';
  };

  return (
    <motion.section 
      id="converter" 
      className="w-full max-w-3xl mx-auto py-16 px-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="space-y-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-medium text-muted-foreground">Selecciona la herramienta que necesitas</p>
          <div className="inline-flex rounded-lg bg-muted p-1 shadow-md">
            <button
              type="button"
              onClick={() => setActiveTool('files')}
              className={`px-5 py-2 text-sm font-medium rounded-md transition-all ${
                activeTool === 'files' 
                  ? 'bg-background text-primary shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Conversión de archivos
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('hash')}
              className={`px-5 py-2 text-sm font-medium rounded-md transition-all ${
                activeTool === 'hash' 
                  ? 'bg-background text-primary shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Hash de texto
            </button>
          </div>
        </div>

        {activeTool === 'files' ? (
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

                    {/* Opciones de Modelo 3D */}
                    {isModel3D && outputFormat && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                      >
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-sm">Opciones de modelo 3D:</p>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                              </svg>
                              <span>{file.name}</span>
                            </div>
                          </div>
                          
                          {/* Nivel de optimización - Estilo slider */}
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-xs text-muted-foreground">
                                Calidad del modelo
                              </label>
                              <span className="text-xs font-medium">
                                {model3DOptions.optimization === 'normal' ? '100% (Original)' : 
                                 model3DOptions.optimization === 'optimized' ? '50% (Optimizado)' : '30% (Rendimiento)'}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="2"
                              value={model3DOptions.optimization === 'normal' ? 2 : model3DOptions.optimization === 'optimized' ? 1 : 0}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setModel3DOptions({
                                  ...model3DOptions, 
                                  optimization: val === 2 ? 'normal' : val === 1 ? 'optimized' : 'performance'
                                });
                              }}
                              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                              <span>Rendimiento</span>
                              <span>Optimizado</span>
                              <span>Original</span>
                            </div>
                          </div>

                          {/* Info sobre el nivel seleccionado */}
                          <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                            <div className="flex items-start gap-2">
                              <svg className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                                <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                              <div className="text-xs text-muted-foreground">
                                {model3DOptions.optimization === 'normal' && (
                                  <span>Mantiene todos los detalles del modelo original. Ideal para impresión 3D de alta calidad.</span>
                                )}
                                {model3DOptions.optimization === 'optimized' && (
                                  <span>Reduce vértices un ~50%. Buen balance entre calidad visual y tamaño de archivo.</span>
                                )}
                                {model3DOptions.optimization === 'performance' && (
                                  <span>Reduce vértices un ~70%. Ideal para visualización web o PCs de gama baja.</span>
                                )}
                              </div>
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
        ) : (
          <Card className={hashCardClasses}>
            <CardHeader className="text-center space-y-4">
              <CardTitle className={`text-3xl font-bold ${isHashDark ? 'text-white' : ''}`}>Generador y verificador de Hash</CardTitle>
              <CardDescription className={isHashDark ? 'text-white/70' : 'text-muted-foreground'}>
                Convierte texto a distintos algoritmos (SHA-256, SHA-3, SHA-512, MD5) y verifica coincidencias. El hashing es un proceso unidireccional, por lo que el "deshash" se logra comparando contra un valor conocido.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
          <div className="grid gap-2">
            <label className={hashLabelClass}>Texto a convertir</label>
            <textarea
              className={hashTextareaClass}
              placeholder="Escribe o pega el contenido que deseas convertir a hash..."
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className={hashSubLabelClass}>Algoritmo</label>
              <Select value={hashAlgorithm} onValueChange={setHashAlgorithm}>
                <SelectTrigger className={isHashDark ? 'bg-[#0f1b2f] border border-white/10 text-white' : 'bg-background'}>
                  <SelectValue placeholder="Selecciona un algoritmo">
                    {HASH_ALGORITHMS.find(a => a.value === hashAlgorithm)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className={isHashDark ? 'bg-[#0f1b2f] text-white border border-white/10' : ''}>
                  {HASH_ALGORITHMS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className={isHashDark ? 'focus:bg-white/10 focus:text-white' : ''}>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{option.label}</span>
                        <span className={`text-[11px] ${isHashDark ? 'text-white/70' : 'text-muted-foreground'}`}>{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className={hashSubLabelClass}>Formato de salida</label>
              <Select value={hashFormat} onValueChange={setHashFormat}>
                <SelectTrigger className={isHashDark ? 'bg-[#0f1b2f] border border-white/10 text-white' : 'bg-background'}>
                  <SelectValue placeholder="Selecciona un formato">
                    {HASH_OUTPUT_FORMATS.find(f => f.value === hashFormat)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className={isHashDark ? 'bg-[#0f1b2f] text-white border border-white/10' : ''}>
                  {HASH_OUTPUT_FORMATS.map((option) => (
                    <SelectItem key={option.value} value={option.value} className={isHashDark ? 'focus:bg-white/10 focus:text-white' : ''}>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{option.label}</span>
                        <span className={`text-[11px] ${isHashDark ? 'text-white/70' : 'text-muted-foreground'}`}>{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-transparent select-none">Acciones</label>
              <div className="flex gap-2">
                <Button className={`flex-1 ${isHashDark ? 'bg-white/10 text-white hover:bg-white/20' : ''}`} onClick={handleGenerateHash} disabled={isHashingText}>
                  {isHashingText ? 'Generando...' : 'Generar Hash'}
                </Button>
                <Button
                  variant="outline"
                  className={isHashDark ? 'border-white/30 text-white hover:bg-white/5' : ''}
                  onClick={handleResetHashFields}
                >
                  Limpiar
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <label className={hashLabelClass}>Hash generado ({hashFormat === 'hex' ? 'Hex' : 'Base64'})</label>
            <div className="flex flex-col md:flex-row gap-2">
              <textarea
                className={hashSmallTextareaClass}
                readOnly
                value={hashResult}
                placeholder="El resultado aparecerá aquí..."
              />
              <Button
                variant="secondary"
                className={isHashDark ? 'bg-white/10 text-white hover:bg-white/20' : ''}
                onClick={handleCopyHash}
                disabled={!hashResult}
              >
                Copiar
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <label className={hashLabelClass}>Hash a verificar ("DesHash")</label>
            <textarea
              className={hashTextareaClass}
              placeholder="Pega aquí el hash que deseas comparar contra el texto original..."
              value={hashCompareValue}
              onChange={(e) => setHashCompareValue(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className={isHashDark ? 'border-white/30 text-white hover:bg-white/5' : ''}
              onClick={handleVerifyHash}
              disabled={isVerifyingHash || !hashCompareValue.trim() || !hashInput.length}
            >
              {isVerifyingHash ? 'Verificando...' : 'Verificar hash'}
            </Button>
            <p className={hashHelperTextClass}>
              Para "deshash" comparamos el hash pegado con el texto original calculando nuevamente el algoritmo seleccionado.
            </p>
          </div>

          {hashStatus && (
            <div className={`rounded-lg border px-4 py-3 text-sm ${getHashStatusClass(hashStatus.variant)}`}>
              {hashStatus.message}
            </div>
          )}
        </CardContent>
      </Card>
        )}
      </div>
    </motion.section>
  );
};

export default FileConverter;