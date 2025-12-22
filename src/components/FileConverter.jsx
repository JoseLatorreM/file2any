import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, File, X, Loader2, ArrowRight, Image as ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { useToast } from './ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// Importar funciones de conversión PDF
import { pdfToText, pdfToImages, pdfToDocx, pdfToMarkdown, PDF_CONVERSION_OPTIONS } from '../lib/pdf';
// Importar las funciones de conversión DOCX
import { docxToTxt, docxToMarkdown, docxToPdf, DOCX_CONVERSION_OPTIONS } from '../lib/docxConverters';
// Importar las funciones de conversión XLSX
import { xlsxToCsv, xlsxToJson, xlsxToXml, xlsxToPdf, XLSX_CONVERSION_OPTIONS } from '../lib/xlsxConverters';
// Importar las funciones de conversión PPTX
import { pptxToImages, pptxToTxt, pptxToPdf, PPTX_CONVERSION_OPTIONS } from '../lib/pptxConverters';
// Importar las funciones de conversión CSV
import { csvToXlsx, csvToJson, csvToXml, csvToPdf, CSV_CONVERSION_OPTIONS } from '../lib/csvConverters';
// Importar las funciones de conversión JSON
import { jsonToCsv, jsonToXlsx, jsonToXml, JSON_CONVERSION_OPTIONS } from '../lib/jsonConverters';
// Importar las funciones de conversión XML
import { xmlToCsv, xmlToXlsx, xmlToJson, XML_CONVERSION_OPTIONS } from '../lib/xmlConverters';
// Importar las funciones de conversión de imágenes
import { 
  convertImage,
  getImageType,
  getConversionOptions as getImageConversionOptions,
  manipulateImage,
  createGifFromImages
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
import { QRCodeCanvas } from 'qrcode.react';
import { QrCode, Download, Palette, Type } from 'lucide-react';
import JSZip from 'jszip';
import { extractGifFrames } from '../lib/gifUtils';
import exifr from 'exifr';
import { Info, Scissors, Play, Pause, Volume2, RefreshCw } from 'lucide-react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import { trimAudio } from '../lib/audioTrimmer';
import JsBarcode from 'jsbarcode';
// Importar las funciones de conversión de video
import {
  convertVideoToGif,
  convertVideoToMp3,
  getVideoType,
  VIDEO_CONVERSION_OPTIONS
} from '../lib/videoConverters';

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

  // Estados para extracción de frames GIF
  const [extractFrames, setExtractFrames] = useState(false);
  const [extractedFrames, setExtractedFrames] = useState([]);
  const [isExtractingFrames, setIsExtractingFrames] = useState(false);
  const [gifFps, setGifFps] = useState('original'); // 'original', '30', '15', '5', '1'

  // Estados para Creador de GIF (Imágenes)
  const [gifMode, setGifMode] = useState('video'); // 'video' | 'images'
  const [gifImages, setGifImages] = useState([]);
  const [gifImageFps, setGifImageFps] = useState('10');
  const [gifImageQuality, setGifImageQuality] = useState('medium');
  const [gifImageWidth, setGifImageWidth] = useState('400');
  const [gifImageProgress, setGifImageProgress] = useState({ current: 0, total: 0, stage: '' });

  // Estados para el Generador de QR
  const [qrValue, setQrValue] = useState('https://files2any.com');
  const [qrSize, setQrSize] = useState(256);
  const [qrFgColor, setQrFgColor] = useState('#000000');
  const [qrBgColor, setQrBgColor] = useState('#ffffff');
  const [qrLevel, setQrLevel] = useState('H'); // L, M, Q, H
  const [qrIncludeImage, setQrIncludeImage] = useState(false);
  const [qrImageSrc, setQrImageSrc] = useState('');

  // Estados para Analizador de Metadatos
  const [metadataResult, setMetadataResult] = useState(null);
  const [isAnalyzingMetadata, setIsAnalyzingMetadata] = useState(false);

  // Estados para Recortador de Audio
  const [audioTrimmerInstance, setAudioTrimmerInstance] = useState(null);
  const [audioRegionsPlugin, setAudioRegionsPlugin] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [trimStartTime, setTrimStartTime] = useState(0);
  const [trimEndTime, setTrimEndTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isTrimming, setIsTrimming] = useState(false);
  const audioContainerRef = React.useRef(null);
  const wavesurferRef = React.useRef(null); // Ref para mantener la instancia sin causar re-renders

  // Estados para conversión de video
  const [videoStartTime, setVideoStartTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(5); // Default 5 seconds for GIF
  const [videoTotalDuration, setVideoTotalDuration] = useState(0);
  const [gifQuality, setGifQuality] = useState('medium'); // 'original', 'medium', 'performance'
  const videoRef = React.useRef(null);

  // Estados para Generador de UUID
  const [uuidCount, setUuidCount] = useState(5);
  const [generatedUuids, setGeneratedUuids] = useState('');
  
  const generateUuids = useCallback(() => {
    const uuids = [];
    for (let i = 0; i < uuidCount; i++) {
      uuids.push(crypto.randomUUID());
    }
    setGeneratedUuids(uuids.join('\n'));
  }, [uuidCount]);

  // Regenerar UUIDs cuando cambia la cantidad
  React.useEffect(() => {
    if (activeTool === 'uuid') {
      generateUuids();
    }
  }, [uuidCount, activeTool, generateUuids]);

  // Estados para Generador de Contraseñas
  const [passwordLength, setPasswordLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');

  const generatePassword = useCallback(() => {
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const numberChars = '0123456789';
    const symbolChars = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    let charset = '';
    if (includeUppercase) charset += uppercaseChars;
    if (includeLowercase) charset += lowercaseChars;
    if (includeNumbers) charset += numberChars;
    if (includeSymbols) charset += symbolChars;

    if (charset === '') {
      setGeneratedPassword('');
      return;
    }

    let password = '';
    const array = new Uint32Array(passwordLength);
    crypto.getRandomValues(array);
    for (let i = 0; i < passwordLength; i++) {
      password += charset[array[i] % charset.length];
    }
    setGeneratedPassword(password);
  }, [passwordLength, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);

  // Regenerar contraseña cuando cambian las opciones o se activa la herramienta
  React.useEffect(() => {
    if (activeTool === 'password') {
      generatePassword();
    }
  }, [activeTool, generatePassword, passwordLength, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);

  // Estados para Generador de Código de Barras
  const [barcodeValue, setBarcodeValue] = useState('123456789');
  const [barcodeFormat, setBarcodeFormat] = useState('CODE128');
  const [barcodeWidth, setBarcodeWidth] = useState(2);
  const [barcodeHeight, setBarcodeHeight] = useState(100);
  const [barcodeDisplayValue, setBarcodeDisplayValue] = useState(true);
  const barcodeCanvasRef = React.useRef(null);

  // Efecto para generar el código de barras
  React.useEffect(() => {
    if (activeTool === 'barcode' && barcodeCanvasRef.current) {
      try {
        // Validación básica para EAN13 para evitar errores visuales
        if (barcodeFormat === 'EAN13' && barcodeValue.length < 12) {
           // No intentar renderizar si es muy corto para EAN13, o usar un fallback
           return;
        }

        JsBarcode(barcodeCanvasRef.current, barcodeValue, {
          format: barcodeFormat,
          width: barcodeWidth,
          height: barcodeHeight,
          displayValue: barcodeDisplayValue,
          margin: 10,
          valid: function(valid) {
            if (!valid) {
              // Si no es válido, solo limpiar el canvas sin mostrar error
              const ctx = barcodeCanvasRef.current.getContext('2d');
              ctx.clearRect(0, 0, barcodeCanvasRef.current.width, barcodeCanvasRef.current.height);
            }
          }
        });
      } catch (error) {
        console.error("Error generando código de barras:", error);
        // Limpiar canvas en caso de error crítico
        const ctx = barcodeCanvasRef.current.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, barcodeCanvasRef.current.width, barcodeCanvasRef.current.height);
        }
      }
    }
  }, [activeTool, barcodeValue, barcodeFormat, barcodeWidth, barcodeHeight, barcodeDisplayValue]);

  // Efecto para inicializar WaveSurfer
  React.useEffect(() => {
    // Solo inicializar si la herramienta activa es audio-trimmer, hay archivo y el contenedor existe
    if (activeTool === 'audio-trimmer' && file && file.type.startsWith('audio/') && audioContainerRef.current) {
      
      // Limpiar instancia previa si existe
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }

      const ws = WaveSurfer.create({
        container: audioContainerRef.current,
        waveColor: '#4f46e5',
        progressColor: '#818cf8',
        cursorColor: '#333',
        barWidth: 2,
        barRadius: 3,
        cursorWidth: 1,
        height: 128,
        barGap: 2,
        minPxPerSec: 100, // Habilita scroll horizontal
        autoScroll: true,
        url: URL.createObjectURL(file),
      });

      const wsRegions = ws.registerPlugin(RegionsPlugin.create());

      ws.on('ready', () => {
        setAudioDuration(ws.getDuration());
        // Crear región inicial (todo el audio)
        wsRegions.addRegion({
          start: 0,
          end: ws.getDuration(),
          color: 'rgba(79, 70, 229, 0.2)',
          drag: true,
          resize: true,
        });
        setTrimStartTime(0);
        setTrimEndTime(ws.getDuration());
      });

      wsRegions.on('region-updated', (region) => {
        setTrimStartTime(region.start);
        setTrimEndTime(region.end);
      });

      wsRegions.on('region-clicked', (region, e) => {
        e.stopPropagation();
        region.play();
      });

      ws.on('play', () => setIsPlayingAudio(true));
      ws.on('pause', () => setIsPlayingAudio(false));
      ws.on('finish', () => setIsPlayingAudio(false));

      wavesurferRef.current = ws;
      setAudioTrimmerInstance(ws);
      setAudioRegionsPlugin(wsRegions);

      // Cleanup al desmontar o cambiar archivo
      return () => {
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
          wavesurferRef.current = null;
        }
      };
    }
  }, [activeTool, file]);

  const downloadQR = () => {
    const canvas = document.getElementById('qr-canvas');
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `qr-code-${Date.now()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast({
        title: '¡QR Descargado!',
        description: 'Tu código QR se ha guardado correctamente.',
      });
    }
  };

  const handleQrImageUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Archivo no válido',
          description: 'Por favor sube solo archivos de imagen (JPG, PNG, etc).',
          variant: 'destructive',
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setQrImageSrc(event.target.result);
        setQrIncludeImage(true);
      };
      reader.readAsDataURL(file);
    }
  };

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

  // Verificar si es un archivo de video
  const isVideo = file && (
    file.type.includes('video') || 
    file.name.toLowerCase().match(/\.(mp4|webm|ogg)$/)
  );

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
    // Manejo especial para herramientas dedicadas
    if (activeTool === 'gif-creator') {
      if (gifMode === 'images') {
        if (gifImages.length < 2) {
          toast({ title: 'Error', description: 'Se requieren al menos 2 imágenes.', variant: 'destructive' });
          return;
        }
        setIsConverting(true);
        try {
          toast({ title: 'Creando GIF', description: 'Procesando imágenes...' });
          const blob = await createGifFromImages(gifImages, {
            fps: parseInt(gifImageFps),
            quality: gifImageQuality,
            width: parseInt(gifImageWidth),
            onProgress: (p) => setGifImageProgress(p)
          });
          
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `animated-${Date.now()}.gif`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
          
          toast({ title: '¡Éxito!', description: 'GIF creado correctamente.' });
        } catch (error) {
          console.error(error);
          toast({ title: 'Error', description: error.message, variant: 'destructive' });
        } finally {
          setIsConverting(false);
        }
        return;
      }

      if (!file) {
        toast({ title: 'Error', description: 'Selecciona un video primero.', variant: 'destructive' });
        return;
      }
      setIsConverting(true);
      try {
        toast({ title: 'Creando GIF', description: `Procesando con calidad: ${gifQuality}...` });
        const blob = await convertVideoToGif(file, videoStartTime, videoDuration, gifQuality, (progress) => {
          // Optional: update progress
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${file.name.replace(/\.[^/.]+$/, "")}.gif`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast({ title: '¡Éxito!', description: 'GIF creado correctamente.' });
      } catch (error) {
        console.error(error);
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } finally {
        setIsConverting(false);
      }
      return;
    }

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
        blob = await pdfToText(file);
        url = URL.createObjectURL(blob);
      }
      // PDF → DOCX
      else if (fileName.endsWith('.pdf') && outputFormat === 'DOCX') {
        blob = await pdfToDocx(file);
        url = URL.createObjectURL(blob);
      }
      // PDF → MD
      else if (fileName.endsWith('.pdf') && (outputFormat === 'MD' || outputFormat === 'MARKDOWN')) {
        blob = await pdfToMarkdown(file);
        url = URL.createObjectURL(blob);
      }
      // PDF → PNG
      else if (fileName.endsWith('.pdf') && outputFormat === 'PNG') {
        const blobs = await pdfToImages(file, 'png');
        blobs.forEach((imgBlob, idx) => {
          const imgUrl = URL.createObjectURL(imgBlob);
          const link = document.createElement('a');
          link.href = imgUrl;
          link.download = `${file.name.replace(/\.pdf$/i, '')}_page${idx + 1}.png`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          setTimeout(() => URL.revokeObjectURL(imgUrl), 1000);
        });
        toast({ title: '¡Conversión exitosa!', description: 'Páginas descargadas como PNG.' });
        setIsConverting(false);
        return;
      }
      // PDF → JPG
      else if (fileName.endsWith('.pdf') && outputFormat === 'JPG') {
        const blobs = await pdfToImages(file, 'jpg');
        blobs.forEach((imgBlob, idx) => {
          const imgUrl = URL.createObjectURL(imgBlob);
          const link = document.createElement('a');
          link.href = imgUrl;
          link.download = `${file.name.replace(/\.pdf$/i, '')}_page${idx + 1}.jpg`;
          document.body.appendChild(link);
          link.click();
          link.remove();
          setTimeout(() => URL.revokeObjectURL(imgUrl), 1000);
        });
        toast({ title: '¡Conversión exitosa!', description: 'Páginas descargadas como JPG.' });
        setIsConverting(false);
        return;
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
      // PDF → Imagen (PNG/JPG) - Bloque redundante eliminado
      /* 
       * Este bloque ya está manejado al inicio de la cadena if/else.
       */
      // Conversión de Video
      else if (isVideo) {
        try {
          const format = outputFormat.toLowerCase();
          if (format === 'mp3') {
             toast({
               title: 'Procesando video',
               description: 'Extrayendo audio a MP3...'
             });
             blob = await convertVideoToMp3(file, (progress) => {
               // Optional: update progress
             });
             url = URL.createObjectURL(blob);
          }
        } catch (error) {
          console.error('Error en conversión de video:', error);
          toast({
            title: 'Error en la conversión',
            description: `No se pudo convertir el video: ${error.message}`,
            variant: 'destructive',
          });
          setIsConverting(false);
          return;
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

  const downloadAllFrames = async (framesToDownload = extractedFrames) => {
    if (!framesToDownload || framesToDownload.length === 0) return;
    
    const zip = new JSZip();
    // Crear carpeta con el nombre del archivo original
    const folderName = file.name.replace(/\.[^/.]+$/, "");
    const folder = zip.folder(folderName);
    
    framesToDownload.forEach((frame) => {
      folder.file(frame.name, frame.blob);
    });
    
    const content = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${folderName}_frames.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const removeFile = () => {
    setFile(null);
    setOutputFormat(null);
    setExtractFrames(false);
    setExtractedFrames([]);
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
      // Intentar primero con el algoritmo y formato seleccionados
      let matches = verifyHash(hashInput, hashCompareValue, hashAlgorithm, hashFormat);
      let matchedAlgorithm = hashAlgorithm;
      let matchedFormat = hashFormat;

      // Si no coincide, intentar auto-detección probando todas las combinaciones
      if (!matches) {
        for (const algo of HASH_ALGORITHMS) {
          for (const fmt of HASH_OUTPUT_FORMATS) {
            // Saltar la combinación que ya probamos
            if (algo.value === hashAlgorithm && fmt.value === hashFormat) continue;
            
            try {
              if (verifyHash(hashInput, hashCompareValue, algo.value, fmt.value)) {
                matches = true;
                matchedAlgorithm = algo.value;
                matchedFormat = fmt.value;
                break;
              }
            } catch (e) {
              // Ignorar errores de formato inválido durante la búsqueda
              continue;
            }
          }
          if (matches) break;
        }
      }

      if (matches) {
        // Si encontramos una coincidencia con otros parámetros, actualizar la UI
        if (matchedAlgorithm !== hashAlgorithm || matchedFormat !== hashFormat) {
          setHashAlgorithm(matchedAlgorithm);
          setHashFormat(matchedFormat);
          toast({
            title: '¡Coincidencia detectada!',
            description: `Se detectó automáticamente: ${matchedAlgorithm} (${matchedFormat === 'hex' ? 'Hexadecimal' : 'Base64'}).`,
            variant: 'default',
          });
        } else {
          toast({
            title: 'Coincidencia encontrada',
            description: 'El hash y el texto corresponden.',
            variant: 'default',
          });
        }

        setHashStatus({
          variant: 'success',
          message: `¡Éxito! El hash coincide usando ${matchedAlgorithm} (${matchedFormat}).`
        });
      } else {
        setHashStatus({
          variant: 'warning',
          message: 'El hash NO coincide con el texto proporcionado (se probaron todos los algoritmos).'
        });
        toast({
          title: 'No coincide',
          description: 'El hash no corresponde con el texto actual en ningún formato conocido.',
          variant: 'destructive',
        });
      }
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
    
    // Detectar formatos de video
    if (isVideo) {
      const videoType = getVideoType(file);
      return VIDEO_CONVERSION_OPTIONS[videoType] || [];
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
          <div className="flex flex-wrap justify-center gap-1 rounded-lg bg-muted p-1 shadow-md w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTool('files')}
              className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                activeTool === 'files' 
                  ? 'bg-background text-primary shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Conversión de archivos
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('qr')}
              className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                activeTool === 'qr' 
                  ? 'bg-background text-primary shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Generador QR
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('hash')}
              className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                activeTool === 'hash' 
                  ? 'bg-background text-primary shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Hash de texto
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('gif-extractor')}
              className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                activeTool === 'gif-extractor' 
                  ? 'bg-background text-primary shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Extractor GIF
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('metadata')}
              className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                activeTool === 'metadata' 
                  ? 'bg-background text-primary shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Analizador de Metadatos
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('gif-creator')}
              className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                activeTool === 'gif-creator' 
                  ? 'bg-background text-primary shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Creador de GIF
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('audio-trimmer')}
              className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                activeTool === 'audio-trimmer' 
                  ? 'bg-background text-primary shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Recortador de Audio
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('uuid')}
              className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                activeTool === 'uuid' 
                  ? 'bg-background text-primary shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Generador UUID
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('barcode')}
              className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                activeTool === 'barcode' 
                  ? 'bg-background text-primary shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Código de Barras
            </button>
            <button
              type="button"
              onClick={() => setActiveTool('password')}
              className={`flex-1 sm:flex-none px-3 sm:px-5 py-2 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                activeTool === 'password' 
                  ? 'bg-background text-primary shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Generador Contraseñas
            </button>
          </div>
        </div>

        {activeTool === 'gif-creator' ? (
          <Card className="shadow-2xl bg-card/80 backdrop-blur-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl sm:text-3xl font-bold">Creador de GIFs</CardTitle>
              <CardDescription>Crea GIFs animados desde videos o secuencias de imágenes.</CardDescription>
              
              <div className="flex justify-center mt-4">
                <div className="flex flex-wrap justify-center gap-1 rounded-lg bg-muted p-1 shadow-md w-auto">
                  <button
                    type="button"
                    onClick={() => setGifMode('video')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                      gifMode === 'video' 
                        ? 'bg-background text-primary shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Desde Video
                  </button>
                  <button
                    type="button"
                    onClick={() => setGifMode('images')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                      gifMode === 'images' 
                        ? 'bg-background text-primary shadow-sm' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Desde Imágenes
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {gifMode === 'video' ? (
                <>
                  {!file ? (
                    <div 
                      className="border-2 border-dashed border-primary/50 rounded-lg p-8 text-center cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => document.getElementById('gif-upload')?.click()}
                    >
                      <input 
                        id="gif-upload" 
                        type="file" 
                        className="hidden" 
                        accept="video/*"
                        onChange={handleFileChange} 
                      />
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <UploadCloud className="h-12 w-12" />
                        <p className="font-semibold">Sube tu video aquí</p>
                        <p className="text-sm">MP4, WEBM, OGG</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between bg-secondary p-3 rounded-lg">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <Play className="h-5 w-5 text-primary flex-shrink-0" />
                          <span className="truncate font-medium text-sm">{file.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={removeFile}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                        <video 
                          ref={videoRef}
                          src={URL.createObjectURL(file)}
                          className="w-full h-full object-contain"
                          onLoadedMetadata={(e) => {
                            setVideoTotalDuration(e.target.duration);
                            if (videoDuration > e.target.duration) setVideoDuration(e.target.duration);
                          }}
                          controls
                        />
                      </div>

                      <div className="space-y-4 p-4 bg-secondary/30 rounded-lg border border-border/50">
                        <div className="flex justify-between text-xs font-medium">
                          <span>Inicio: {videoStartTime.toFixed(1)}s</span>
                          <span>Duración: {videoDuration.toFixed(1)}s</span>
                        </div>
                        
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Punto de inicio</label>
                          <input 
                            type="range"
                            min="0"
                            max={Math.max(0, videoTotalDuration - 0.1)}
                            step="0.1"
                            value={videoStartTime}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setVideoStartTime(val);
                              if (videoRef.current) videoRef.current.currentTime = val;
                              if (val + videoDuration > videoTotalDuration) {
                                setVideoDuration(Math.max(0.1, videoTotalDuration - val));
                              }
                            }}
                            className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Duración del GIF (máx 30s)</label>
                          <input 
                            type="range"
                            min="0.5"
                            max={Math.min(30, Math.max(0.5, videoTotalDuration - videoStartTime))}
                            step="0.1"
                            value={videoDuration}
                            onChange={(e) => setVideoDuration(parseFloat(e.target.value))}
                            className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        <div className="pt-2 border-t border-border/50">
                          <label className="text-sm font-medium mb-2 block">Calidad de Conversión</label>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => setGifQuality('original')}
                              className={`p-2 rounded-md text-xs border transition-all ${
                                gifQuality === 'original' 
                                  ? 'bg-primary text-primary-foreground border-primary' 
                                  : 'bg-background hover:bg-accent border-border'
                              }`}
                            >
                              <span className="block font-bold mb-0.5">Original</span>
                              <span className="text-[10px] opacity-80">Alta calidad, lento</span>
                            </button>
                            <button
                              onClick={() => setGifQuality('medium')}
                              className={`p-2 rounded-md text-xs border transition-all ${
                                gifQuality === 'medium' 
                                  ? 'bg-primary text-primary-foreground border-primary' 
                                  : 'bg-background hover:bg-accent border-border'
                              }`}
                            >
                              <span className="block font-bold mb-0.5">Media</span>
                              <span className="text-[10px] opacity-80">Balanceado</span>
                            </button>
                            <button
                              onClick={() => setGifQuality('performance')}
                              className={`p-2 rounded-md text-xs border transition-all ${
                                gifQuality === 'performance' 
                                  ? 'bg-primary text-primary-foreground border-primary' 
                                  : 'bg-background hover:bg-accent border-border'
                              }`}
                            >
                              <span className="block font-bold mb-0.5">Rendimiento</span>
                              <span className="text-[10px] opacity-80">Baja calidad, rápido</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <Button 
                        onClick={handleConvert} 
                        disabled={isConverting}
                        className="w-full h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                      >
                        {isConverting ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Creando GIF...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-5 w-5" />
                            Generar GIF
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-6">
                  {/* Modo Imágenes */}
                  {gifImages.length === 0 ? (
                    <div 
                      className="border-2 border-dashed border-primary/50 rounded-lg p-8 text-center cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => document.getElementById('gif-images-upload')?.click()}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                        if (files.length > 0) setGifImages(files);
                      }}
                      onDragOver={(e) => e.preventDefault()}
                    >
                      <input 
                        id="gif-images-upload" 
                        type="file" 
                        className="hidden" 
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files?.length) {
                            setGifImages(Array.from(e.target.files));
                          }
                        }} 
                      />
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ImageIcon className="h-12 w-12" />
                        <p className="font-semibold">Sube tus imágenes aquí</p>
                        <p className="text-sm">Arrastra múltiples imágenes o una carpeta</p>
                        <p className="text-xs opacity-70">Mínimo 2 imágenes</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between bg-secondary p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                          <ImageIcon className="h-5 w-5 text-primary" />
                          <span className="font-medium text-sm">{gifImages.length} imágenes seleccionadas</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => setGifImages([])} className="text-destructive hover:text-destructive">
                          Limpiar
                        </Button>
                      </div>

                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 bg-secondary/20 rounded-lg">
                        {gifImages.map((img, idx) => (
                          <div key={idx} className="relative aspect-square bg-background rounded overflow-hidden border border-border/50">
                            <img src={URL.createObjectURL(img)} alt="" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>

                      <div className="space-y-4 p-4 bg-secondary/30 rounded-lg border border-border/50">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Velocidad</label>
                            <Select value={gifImageFps} onValueChange={setGifImageFps}>
                              <SelectTrigger className="bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="2">0.25x (Muy Lento)</SelectItem>
                                <SelectItem value="5">0.5x (Lento)</SelectItem>
                                <SelectItem value="10">1x (Normal)</SelectItem>
                                <SelectItem value="20">2x (Rápido)</SelectItem>
                                <SelectItem value="30">3x (Muy Rápido)</SelectItem>
                                <SelectItem value="50">5x (Ultra Rápido)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Calidad</label>
                            <Select value={gifImageQuality} onValueChange={setGifImageQuality}>
                              <SelectTrigger className="bg-background">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="low">Baja (Rápido)</SelectItem>
                                <SelectItem value="medium">Media (Balanceada)</SelectItem>
                                <SelectItem value="high">Alta (Lento)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Ancho (px)</label>
                            <input
                              type="number"
                              min="100"
                              max="2000"
                              step="50"
                              value={gifImageWidth}
                              onChange={(e) => setGifImageWidth(e.target.value)}
                              className="w-full px-3 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                          </div>
                        </div>
                      </div>

                      {isConverting && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{gifImageProgress.stage}</span>
                            <span>{Math.round((gifImageProgress.current / gifImageProgress.total) * 100)}%</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-primary"
                              initial={{ width: 0 }}
                              animate={{ width: `${(gifImageProgress.current / gifImageProgress.total) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <Button 
                        onClick={handleConvert} 
                        disabled={isConverting || gifImages.length < 2}
                        className="w-full h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                      >
                        {isConverting ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-5 w-5" />
                            Crear GIF
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {activeTool === 'files' ? (
          <Card className="shadow-2xl bg-card/80 backdrop-blur-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl sm:text-3xl font-bold">Conversor de Archivos Universal</CardTitle>
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

                    {/* Opciones de Video */}
                    {file && outputFormat && isVideo && (
                      <motion.div
                        className="w-full mt-4 bg-secondary/50 p-4 rounded-lg shadow-inner"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                      >
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-sm">Opciones de video:</p>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Play className="h-3 w-3 mr-1" />
                              <span>{file.name}</span>
                            </div>
                          </div>

                          {outputFormat.toLowerCase() === 'gif' && (
                            <div className="space-y-4">
                              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                                <video 
                                  ref={videoRef}
                                  src={URL.createObjectURL(file)}
                                  className="w-full h-full object-contain"
                                  onLoadedMetadata={(e) => {
                                    setVideoTotalDuration(e.target.duration);
                                    if (videoDuration > e.target.duration) {
                                      setVideoDuration(e.target.duration);
                                    }
                                  }}
                                  controls
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                  <span>Inicio: {videoStartTime.toFixed(1)}s</span>
                                  <span>Duración: {videoDuration.toFixed(1)}s</span>
                                </div>
                                
                                <div>
                                  <label className="text-xs text-muted-foreground">Punto de inicio</label>
                                  <input 
                                    type="range"
                                    min="0"
                                    max={Math.max(0, videoTotalDuration - 0.1)}
                                    step="0.1"
                                    value={videoStartTime}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value);
                                      setVideoStartTime(val);
                                      if (videoRef.current) videoRef.current.currentTime = val;
                                      // Adjust duration if it exceeds total
                                      if (val + videoDuration > videoTotalDuration) {
                                        setVideoDuration(Math.max(0.1, videoTotalDuration - val));
                                      }
                                    }}
                                    className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer"
                                  />
                                </div>

                                <div>
                                  <label className="text-xs text-muted-foreground">Duración del GIF (máx 30s)</label>
                                  <input 
                                    type="range"
                                    min="0.5"
                                    max={Math.min(30, Math.max(0.5, videoTotalDuration - videoStartTime))}
                                    step="0.1"
                                    value={videoDuration}
                                    onChange={(e) => setVideoDuration(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-primary/20 rounded-lg appearance-none cursor-pointer"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {outputFormat.toLowerCase() === 'mp3' && (
                            <div className="text-sm text-muted-foreground">
                              Se extraerá el audio completo del video en formato MP3 de alta calidad.
                            </div>
                          )}
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
                      {isExtractingFrames ? 'Extrayendo frames...' : 'Convirtiendo...'}
                    </>
                  ) : (
                    'Convertir Archivo'
                  )}
                </Button>
              </div>

              {/* Sección de Frames Extraídos */}
              {extractedFrames.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-8 border-t pt-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Frames Extraídos ({extractedFrames.length})</h3>
                    <Button onClick={() => downloadAllFrames()} variant="default" size="sm">
                      <Download className="mr-2 h-4 w-4" />
                      Descargar Todo (ZIP)
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto p-2 bg-secondary/20 rounded-lg">
                    {extractedFrames.map((frame, idx) => (
                      <div key={idx} className="relative group bg-background rounded-md overflow-hidden border shadow-sm hover:shadow-md transition-all">
                        <div className="aspect-square relative">
                          <img 
                            src={frame.url} 
                            alt={`Frame ${idx + 1}`} 
                            className="w-full h-full object-contain p-1"
                          />
                        </div>
                        <div className="p-2 text-xs text-center border-t bg-muted/50 truncate">
                          Frame {idx + 1}
                        </div>
                        <a 
                          href={frame.url} 
                          download={frame.name}
                          className="absolute top-2 right-2 bg-primary text-primary-foreground p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                          title="Descargar frame"
                        >
                          <Download className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        ) : activeTool === 'qr' ? (
          <Card className="shadow-2xl bg-card/80 backdrop-blur-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl sm:text-3xl font-bold">Generador de Códigos QR</CardTitle>
              <CardDescription>Crea códigos QR personalizados con colores, logos y estilos únicos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Controles */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contenido del QR</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={qrValue}
                        onChange={(e) => setQrValue(e.target.value)}
                        className="w-full p-3 rounded-md border bg-background pr-10"
                        placeholder="https://ejemplo.com o Texto"
                      />
                      <Type className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2 h-5">
                        <Palette className="h-4 w-4" /> Color QR
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={qrFgColor}
                          onChange={(e) => setQrFgColor(e.target.value)}
                          className="h-10 w-full cursor-pointer rounded-md border p-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2 h-5">
                        <div className="h-4 w-4 border rounded bg-white" /> Fondo
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={qrBgColor}
                          onChange={(e) => setQrBgColor(e.target.value)}
                          className="h-10 w-full cursor-pointer rounded-md border p-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Logo Central (Opcional)</label>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => document.getElementById('qr-logo-upload').click()}
                      >
                        <UploadCloud className="mr-2 h-4 w-4" />
                        {qrIncludeImage ? 'Cambiar Logo' : 'Subir Logo'}
                      </Button>
                      {qrIncludeImage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setQrIncludeImage(false);
                            setQrImageSrc('');
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <input
                      id="qr-logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleQrImageUpload}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nivel de Corrección</label>
                    <Select value={qrLevel} onValueChange={setQrLevel}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="L">Bajo (7%)</SelectItem>
                        <SelectItem value="M">Medio (15%)</SelectItem>
                        <SelectItem value="Q">Alto (25%)</SelectItem>
                        <SelectItem value="H">Máximo (30%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Previsualización */}
                <div className="flex flex-col items-center justify-center space-y-6 bg-muted/30 rounded-xl p-6 border overflow-hidden">
                  <div className="bg-white p-4 rounded-lg shadow-sm max-w-full flex justify-center">
                    <QRCodeCanvas
                      id="qr-canvas"
                      value={qrValue}
                      size={qrSize}
                      bgColor={qrBgColor}
                      fgColor={qrFgColor}
                      style={{ maxWidth: '100%', height: 'auto' }}
                      level={qrLevel}
                      includeMargin={true}
                      imageSettings={qrIncludeImage && qrImageSrc ? {
                        src: qrImageSrc,
                        x: undefined,
                        y: undefined,
                        height: qrSize * 0.2,
                        width: qrSize * 0.2,
                        excavate: true,
                      } : undefined}
                    />
                  </div>
                  <Button onClick={downloadQR} className="w-full max-w-xs" size="lg">
                    <Download className="mr-2 h-4 w-4" /> Descargar PNG
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : activeTool === 'hash' ? (
          <Card className={hashCardClasses}>
            <CardHeader className="text-center space-y-4">
              <CardTitle className={`text-2xl sm:text-3xl font-bold ${isHashDark ? 'text-white' : ''}`}>Generador y verificador de Hash</CardTitle>
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
            <label className={hashLabelClass}>Hash a verificar</label>
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
    ) : activeTool === 'gif-extractor' ? (
      <Card className="shadow-2xl bg-card/80 backdrop-blur-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl sm:text-3xl font-bold">Extractor de Frames GIF</CardTitle>
          <CardDescription>Descompón tus GIFs animados en imágenes individuales de alta calidad.</CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {!file || !file.name.toLowerCase().endsWith('.gif') ? (
              <motion.div
                key="dropzone-gif"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
              >
                <div 
                  className="border-2 border-dashed border-primary/50 rounded-lg p-8 text-center cursor-pointer hover:bg-accent transition-colors"
                  onDrop={(e) => {
                    e.preventDefault();
                    const droppedFile = e.dataTransfer.files[0];
                    if (droppedFile && droppedFile.name.toLowerCase().endsWith('.gif')) {
                      setFile(droppedFile);
                      setOutputFormat('PNG'); // Default format
                    } else {
                      toast({
                        title: 'Archivo no válido',
                        description: 'Por favor sube un archivo GIF.',
                        variant: 'destructive'
                      });
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => document.getElementById('gif-upload')?.click()}
                >
                  <input 
                    id="gif-upload" 
                    type="file" 
                    className="hidden" 
                    accept=".gif"
                    onChange={(e) => {
                      const selectedFile = e.target.files[0];
                      if (selectedFile) {
                        setFile(selectedFile);
                        setOutputFormat('PNG');
                      }
                    }} 
                  />
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <ImageIcon className="h-12 w-12" />
                    <p className="font-semibold">Arrastra tu GIF aquí</p>
                    <p className="text-sm">o haz clic para seleccionar</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="gif-options"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 bg-secondary p-3 rounded-lg shadow-inner">
                  <ImageIcon className="h-8 w-8 text-primary flex-shrink-0" />
                  <div className="flex-grow overflow-hidden">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <p className="text-muted-foreground text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={removeFile} className="h-8 w-8 flex-shrink-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-sm font-medium">Formato de salida</label>
                    <Select value={outputFormat} onValueChange={setOutputFormat}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona formato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PNG">PNG (Recomendado)</SelectItem>
                        <SelectItem value="JPG">JPG</SelectItem>
                        <SelectItem value="BMP">BMP</SelectItem>
                        <SelectItem value="SVG">SVG (Incrustado)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-medium">Frecuencia de extracción (FPS)</label>
                    <Select value={gifFps} onValueChange={setGifFps}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona FPS" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="original">Todos los frames (Original)</SelectItem>
                        <SelectItem value="60">60 FPS (Muy fluido)</SelectItem>
                        <SelectItem value="30">30 FPS (Estándar)</SelectItem>
                        <SelectItem value="15">15 FPS (Económico)</SelectItem>
                        <SelectItem value="5">5 FPS (Resumen)</SelectItem>
                        <SelectItem value="1">1 FPS (1 imagen/seg)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-center pt-4">
                  <Button 
                    size="lg" 
                    onClick={async () => {
                      setIsExtractingFrames(true);
                      try {
                        toast({
                          title: 'Iniciando extracción',
                          description: 'Cargando motor de procesamiento...',
                        });
                        
                        const frames = await extractGifFrames(file, outputFormat, gifFps, (msg) => {
                          if (msg.includes('Cargando') || msg.includes('Procesando') || msg.includes('Generando')) {
                             toast({
                               title: 'Procesando GIF',
                               description: msg,
                               duration: 2000,
                             });
                          }
                        });
                        setExtractedFrames(frames);
                        
                        toast({
                          title: '¡Extracción completada!',
                          description: `Se han extraído ${frames.length} frames. Puedes descargar el ZIP o imágenes individuales.`,
                        });

                        // await downloadAllFrames(frames);

                      } catch (error) {
                        console.error('Error extrayendo frames:', error);
                        toast({
                          title: 'Error',
                          description: `No se pudieron extraer los frames: ${error.message}`,
                          variant: 'destructive',
                        });
                      }
                      setIsExtractingFrames(false);
                    }} 
                    disabled={isExtractingFrames} 
                    className="w-full max-w-xs"
                  >
                    {isExtractingFrames ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Extrayendo frames...
                      </>
                    ) : (
                      'Extraer Frames'
                    )}
                  </Button>
                </div>

                {extractedFrames.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-8 border-t pt-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Frames Extraídos ({extractedFrames.length})</h3>
                      <Button onClick={() => downloadAllFrames()} variant="default" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Descargar ZIP
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto p-2 bg-secondary/20 rounded-lg">
                      {extractedFrames.map((frame, idx) => (
                        <div key={idx} className="relative group bg-background rounded-md overflow-hidden border shadow-sm hover:shadow-md transition-all">
                          <div className="aspect-square relative">
                            <img 
                              src={frame.url} 
                              alt={`Frame ${idx + 1}`} 
                              className="w-full h-full object-contain p-1"
                            />
                          </div>
                          <div className="p-2 text-xs text-center border-t bg-muted/50 truncate">
                            Frame {idx + 1}
                          </div>
                          <a 
                            href={frame.url} 
                            download={frame.name}
                            className="absolute top-2 right-2 bg-primary text-primary-foreground p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            title="Descargar frame"
                          >
                            <Download className="h-3 w-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    ) : activeTool === 'metadata' ? (
      <Card className="shadow-2xl bg-card/80 backdrop-blur-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl sm:text-3xl font-bold">Analizador de Metadatos</CardTitle>
          <CardDescription>Extrae información oculta (EXIF, IPTC, XMP) de tus imágenes.</CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {!file ? (
              <motion.div
                key="dropzone-metadata"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
              >
                <div 
                  className="border-2 border-dashed border-primary/50 rounded-lg p-8 text-center cursor-pointer hover:bg-accent transition-colors"
                  onDrop={(e) => {
                    e.preventDefault();
                    const droppedFile = e.dataTransfer.files[0];
                    if (droppedFile && droppedFile.type.startsWith('image/')) {
                      setFile(droppedFile);
                      setMetadataResult(null);
                    } else {
                      toast({
                        title: 'Archivo no válido',
                        description: 'Por favor sube un archivo de imagen.',
                        variant: 'destructive'
                      });
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => document.getElementById('metadata-upload')?.click()}
                >
                  <input 
                    id="metadata-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => {
                      const selectedFile = e.target.files[0];
                      if (selectedFile) {
                        setFile(selectedFile);
                        setMetadataResult(null);
                      }
                    }} 
                  />
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Info className="h-12 w-12" />
                    <p className="font-semibold">Arrastra tu imagen aquí</p>
                    <p className="text-sm">o haz clic para seleccionar</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="metadata-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 bg-secondary p-3 rounded-lg shadow-inner">
                  <ImageIcon className="h-8 w-8 text-primary flex-shrink-0" />
                  <div className="flex-grow overflow-hidden">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <p className="text-muted-foreground text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => { removeFile(); setMetadataResult(null); }} className="h-8 w-8 flex-shrink-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex justify-center">
                  <Button 
                    size="lg" 
                    onClick={async () => {
                      setIsAnalyzingMetadata(true);
                      try {
                        // Extraer todos los metadatos posibles
                        const output = await exifr.parse(file, {
                          tiff: true,
                          xmp: true,
                          icc: true,
                          iptc: true,
                          jfif: true,
                          ihdr: true,
                          exif: true,
                          gps: true,
                          interop: true,
                          makerNote: true,
                          userComment: true,
                          mergeOutput: false // Mantener separado para mejor organización
                        });

                        if (!output) {
                           throw new Error("No se encontraron metadatos en esta imagen.");
                        }
                        setMetadataResult(output);
                        toast({
                          title: 'Análisis completado',
                          description: 'Se han extraído los metadatos de la imagen.',
                        });
                      } catch (error) {
                        console.error('Error analizando metadatos:', error);
                        toast({
                          title: 'Información',
                          description: `No se encontraron metadatos legibles o hubo un error: ${error.message}`,
                          variant: 'default',
                        });
                        setMetadataResult({});
                      }
                      setIsAnalyzingMetadata(false);
                    }} 
                    disabled={isAnalyzingMetadata} 
                    className="w-full max-w-xs"
                  >
                    {isAnalyzingMetadata ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analizando...
                      </>
                    ) : (
                      'Analizar Metadatos'
                    )}
                  </Button>
                </div>

                {metadataResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-8 border-t pt-6 space-y-6"
                  >
                    {Object.keys(metadataResult).length === 0 ? (
                       <div className="text-center text-muted-foreground p-4">
                         No se encontraron metadatos extendidos en esta imagen.
                       </div>
                    ) : (
                      Object.entries(metadataResult).map(([section, data]) => {
                        if (!data || Object.keys(data).length === 0) return null;
                        return (
                          <div key={section} className="space-y-2">
                            <h3 className="text-lg font-semibold capitalize border-b pb-2">{section}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                              {Object.entries(data).map(([key, value]) => {
                                // Filtrar valores binarios largos o buffers
                                if (value instanceof Uint8Array || value instanceof ArrayBuffer) return null;
                                let displayValue = String(value);
                                if (typeof value === 'object' && value !== null) {
                                    try { displayValue = JSON.stringify(value); } catch(e) { displayValue = '[Object]'; }
                                }
                                return (
                                  <div key={key} className="flex flex-col sm:flex-row sm:justify-between py-1 border-b border-border/50">
                                    <span className="font-medium text-muted-foreground mr-2">{key}:</span>
                                    <span className="break-all text-right">{displayValue}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    ) : activeTool === 'audio-trimmer' ? (
      <Card className="shadow-2xl bg-card/80 backdrop-blur-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl sm:text-3xl font-bold">Recortador de Audio</CardTitle>
          <CardDescription>Sube un archivo de audio, selecciona el fragmento que deseas y descárgalo.</CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatePresence>
            {!file ? (
              <motion.div
                key="dropzone-audio"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3 }}
              >
                <div 
                  className="border-2 border-dashed border-primary/50 rounded-lg p-8 text-center cursor-pointer hover:bg-accent transition-colors"
                  onDrop={(e) => {
                    e.preventDefault();
                    const droppedFile = e.dataTransfer.files[0];
                    if (droppedFile && droppedFile.type.startsWith('audio/')) {
                      setFile(droppedFile);
                    } else {
                      toast({
                        title: 'Archivo no válido',
                        description: 'Por favor sube un archivo de audio.',
                        variant: 'destructive'
                      });
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => document.getElementById('audio-upload')?.click()}
                >
                  <input 
                    id="audio-upload" 
                    type="file" 
                    className="hidden" 
                    accept="audio/*"
                    onChange={(e) => {
                      const selectedFile = e.target.files[0];
                      if (selectedFile) {
                        setFile(selectedFile);
                      }
                    }} 
                  />
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Volume2 className="h-12 w-12" />
                    <p className="font-semibold">Arrastra tu audio aquí</p>
                    <p className="text-sm">o haz clic para seleccionar</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="audio-editor"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 bg-secondary p-3 rounded-lg shadow-inner">
                  <Volume2 className="h-8 w-8 text-primary flex-shrink-0" />
                  <div className="flex-grow overflow-hidden">
                    <p className="font-medium text-sm truncate">{file.name}</p>
                    <p className="text-muted-foreground text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => { 
                    removeFile(); 
                    if (audioTrimmerInstance) {
                      audioTrimmerInstance.destroy();
                      setAudioTrimmerInstance(null);
                    }
                  }} className="h-8 w-8 flex-shrink-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="bg-background border rounded-lg p-4 shadow-sm overflow-hidden">
                  <div className="mb-2 text-center text-sm text-muted-foreground">
                    <Info className="inline-block w-4 h-4 mr-1 mb-0.5" />
                    Arrastra los bordes de la zona sombreada para seleccionar el fragmento a recortar.
                  </div>
                  <div ref={audioContainerRef} className="w-full overflow-x-auto" />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => audioTrimmerInstance && audioTrimmerInstance.playPause()}
                    >
                      {isPlayingAudio ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <div className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {trimStartTime.toFixed(2)}s - {trimEndTime.toFixed(2)}s
                    </div>
                  </div>

                  <Button 
                    size="lg" 
                    onClick={async () => {
                      setIsTrimming(true);
                      try {
                        const blob = await trimAudio(file, trimStartTime, trimEndTime, (msg) => {
                           toast({
                             title: 'Procesando audio',
                             description: msg,
                             duration: 1000,
                           });
                        });
                        
                        // Descargar
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `recorte_${file.name.replace(/\.[^/.]+$/, "")}.wav`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);

                        toast({
                          title: '¡Recorte completado!',
                          description: 'Tu archivo de audio ha sido descargado.',
                        });

                      } catch (error) {
                        console.error('Error recortando audio:', error);
                        toast({
                          title: 'Error',
                          description: `No se pudo recortar el audio: ${error.message}`,
                          variant: 'destructive',
                        });
                      }
                      setIsTrimming(false);
                    }} 
                    disabled={isTrimming} 
                    className="w-full sm:w-auto"
                  >
                    {isTrimming ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Scissors className="mr-2 h-4 w-4" />
                        Recortar y Descargar
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    ) : activeTool === 'uuid' ? (
      <Card className="shadow-2xl bg-card/80 backdrop-blur-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl sm:text-3xl font-bold">Generador de UUID</CardTitle>
          <CardDescription>Genera identificadores únicos universales (UUID v4) de forma segura.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Cantidad de UUIDs: {uuidCount}</label>
              </div>
              <input
                type="range"
                min="1"
                max="200"
                value={uuidCount}
                onChange={(e) => setUuidCount(parseInt(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>

            <div className="relative">
              <textarea
                readOnly
                value={generatedUuids}
                className="w-full h-64 p-4 font-mono text-sm bg-muted/50 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(generatedUuids);
                  toast({
                    title: 'Copiado',
                    description: 'UUIDs copiados al portapapeles',
                  });
                }}
              >
                <File className="mr-2 h-4 w-4" />
                Copiar
              </Button>
              <Button
                onClick={() => {
                  const blob = new Blob([generatedUuids], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `uuids-${Date.now()}.txt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar .txt
              </Button>
              <Button
                onClick={async () => {
                  const uuids = generatedUuids.split('\n').filter(Boolean);
                  if (uuids.length === 0) return;
                  const zip = new JSZip();
                  let errorCount = 0;
                  for (const uuid of uuids) {
                    try {
                      // CODE128 soporta cualquier UUID
                      const canvas = document.createElement('canvas');
                      JsBarcode(canvas, uuid, {
                        format: 'CODE128',
                        width: 2,
                        height: 80,
                        displayValue: false,
                        margin: 10
                      });
                      const dataUrl = canvas.toDataURL('image/png');
                      const base64 = dataUrl.split(',')[1];
                      zip.file(`barcode-${uuid}.png`, base64, { base64: true });
                    } catch (e) {
                      errorCount++;
                    }
                  }
                  const content = await zip.generateAsync({ type: 'blob' });
                  const url = URL.createObjectURL(content);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `barcodes-uuids-${Date.now()}.zip`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  if (errorCount > 0) {
                    toast({ title: 'Atención', description: `Algunos UUIDs no pudieron convertirse (${errorCount}).`, variant: 'destructive' });
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Descargar en código de barras
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    ) : activeTool === 'barcode' ? (
      <Card className="shadow-2xl bg-card/80 backdrop-blur-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl sm:text-3xl font-bold">Generador de Código de Barras</CardTitle>
          <CardDescription>Crea códigos de barras personalizados en múltiples formatos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Controles */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Texto / Datos</label>
                <input
                  type="text"
                  value={barcodeValue}
                  onChange={(e) => setBarcodeValue(e.target.value)}
                  className="w-full p-2 rounded-md border bg-background"
                  placeholder="Ej: 123456789"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Formato</label>
                <Select value={barcodeFormat} onValueChange={setBarcodeFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona formato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CODE128">CODE128 (Auto)</SelectItem>
                    <SelectItem value="CODE39">CODE39</SelectItem>
                    <SelectItem value="EAN13">EAN13</SelectItem>
                    <SelectItem value="UPC">UPC</SelectItem>
                    <SelectItem value="ITF14">ITF14</SelectItem>
                    <SelectItem value="MSI">MSI</SelectItem>
                    <SelectItem value="pharmacode">Pharmacode</SelectItem>
                  </SelectContent>
                </Select>
                {/* Mensajes de ayuda por formato */}
                {barcodeFormat === 'CODE128' && (
                  <div className="text-xs text-red-600 mt-1">Admite cualquier texto, números y símbolos.</div>
                )}
                {barcodeFormat === 'CODE39' && (
                  <div className="text-xs text-red-600 mt-1">Solo letras mayúsculas (A-Z), números (0-9) y - . $ / + % espacio.</div>
                )}
                {barcodeFormat === 'EAN13' && (
                  <div className="text-xs text-red-600 mt-1">Solo números (0-9). Debe tener 12 o 13 dígitos.</div>
                )}
                {barcodeFormat === 'UPC' && (
                  <div className="text-xs text-red-600 mt-1">Solo números (0-9). Debe tener exactamente 12 dígitos.</div>
                )}
                {barcodeFormat === 'ITF14' && (
                  <div className="text-xs text-red-600 mt-1">Solo números (0-9). Debe tener exactamente 14 dígitos.</div>
                )}
                {barcodeFormat === 'MSI' && (
                  <div className="text-xs text-red-600 mt-1">Solo números (0-9). Longitud libre.</div>
                )}
                {barcodeFormat === 'pharmacode' && (
                  <div className="text-xs text-red-600 mt-1">Solo números (0-9). Entre 3 y 131070.</div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Ancho de barra: {barcodeWidth}</label>
                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="1"
                    value={barcodeWidth}
                    onChange={(e) => setBarcodeWidth(parseInt(e.target.value))}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Altura: {barcodeHeight}</label>
                  <input
                    type="range"
                    min="30"
                    max="150"
                    value={barcodeHeight}
                    onChange={(e) => setBarcodeHeight(parseInt(e.target.value))}
                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="show-text"
                  checked={barcodeDisplayValue}
                  onChange={(e) => setBarcodeDisplayValue(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="show-text" className="text-sm font-medium cursor-pointer">
                  Mostrar texto debajo
                </label>
              </div>
            </div>

            {/* Vista Previa */}
            <div className="flex flex-col items-center justify-center space-y-6 bg-muted/30 p-6 rounded-lg border">
              <div className="bg-white p-4 rounded shadow-sm overflow-hidden max-w-full">
                <canvas ref={barcodeCanvasRef} className="max-w-full h-auto" />
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  onClick={() => {
                    if (barcodeCanvasRef.current) {
                      const url = barcodeCanvasRef.current.toDataURL("image/png");
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `barcode-${barcodeValue}.png`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }
                  }}
                  className="w-full sm:w-auto"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Descargar PNG
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    ) : activeTool === 'password' ? (
      <Card className="shadow-2xl bg-card/80 backdrop-blur-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl sm:text-3xl font-bold">Generador de Contraseñas</CardTitle>
          <CardDescription>Crea contraseñas seguras y personalizadas al instante.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-6 max-w-2xl mx-auto">
            {/* Display de Contraseña */}
            <div className="relative">
              <div className="w-full p-4 text-center font-mono text-xl sm:text-2xl bg-muted/50 rounded-lg border break-all min-h-[4rem] flex items-center justify-center">
                {generatedPassword || <span className="text-muted-foreground text-sm">Selecciona al menos una opción</span>}
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={() => {
                  if (generatedPassword) {
                    navigator.clipboard.writeText(generatedPassword);
                    toast({
                      title: 'Copiado',
                      description: 'Contraseña copiada al portapapeles',
                    });
                  }
                }}
                disabled={!generatedPassword}
              >
                <File className="h-4 w-4" />
              </Button>
            </div>

            {/* Controles */}
            <div className="space-y-6 bg-secondary/20 p-6 rounded-lg border">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <label className="text-sm font-medium">Longitud: {passwordLength}</label>
                </div>
                <input
                  type="range"
                  min="4"
                  max="64"
                  value={passwordLength}
                  onChange={(e) => setPasswordLength(parseInt(e.target.value))}
                  className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="include-uppercase"
                    checked={includeUppercase}
                    onChange={(e) => setIncludeUppercase(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                  />
                  <label htmlFor="include-uppercase" className="text-sm font-medium cursor-pointer select-none">
                    Mayúsculas (A-Z)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="include-lowercase"
                    checked={includeLowercase}
                    onChange={(e) => setIncludeLowercase(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                  />
                  <label htmlFor="include-lowercase" className="text-sm font-medium cursor-pointer select-none">
                    Minúsculas (a-z)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="include-numbers"
                    checked={includeNumbers}
                    onChange={(e) => setIncludeNumbers(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                  />
                  <label htmlFor="include-numbers" className="text-sm font-medium cursor-pointer select-none">
                    Números (0-9)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="include-symbols"
                    checked={includeSymbols}
                    onChange={(e) => setIncludeSymbols(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                  />
                  <label htmlFor="include-symbols" className="text-sm font-medium cursor-pointer select-none">
                    Símbolos (!@#$)
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center">
              <Button 
                onClick={generatePassword}
                className="w-full sm:w-auto min-w-[150px]"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Regenerar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    ) : null}
      </div>
    </motion.section>
  );
};

export default FileConverter;