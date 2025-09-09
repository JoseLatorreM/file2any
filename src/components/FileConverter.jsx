
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, File, X, Loader2, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { useToast } from './ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

// Importar las funciones de conversión PDF
import { pdfToDocx, pdfToTxt, pdfToMarkdown, extractTextFromPDF } from '../lib/pdfConverters';

const FileConverter = () => {
  const [file, setFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [outputFormat, setOutputFormat] = useState(null);
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
    toast({
      title: 'Procesando...',
      description: `Convirtiendo ${file.name} a ${outputFormat}...`,
    });

    try {
      let blob = null;
      let url = null;
      // PDF → TXT
      if (file.name.toLowerCase().endsWith('.pdf') && outputFormat === 'TXT') {
        const pdfContent = await extractTextFromPDF(file);
        blob = await pdfToTxt(pdfContent);
        url = URL.createObjectURL(blob);
      }
      // PDF → DOCX
      else if (file.name.toLowerCase().endsWith('.pdf') && outputFormat === 'DOCX') {
        const pdfContent = await extractTextFromPDF(file);
        blob = await pdfToDocx(pdfContent);
        url = URL.createObjectURL(blob);
      }
      // PDF → MD
      else if (file.name.toLowerCase().endsWith('.pdf') && (outputFormat === 'MD' || outputFormat === 'MARKDOWN')) {
        const pdfContent = await extractTextFromPDF(file);
        blob = await pdfToMarkdown(pdfContent);
        url = URL.createObjectURL(blob);
      }
      // No implementado
      else {
        throw new Error('Conversión no implementada para este formato.');
      }

      // Descargar el archivo convertido
      const downloadName = file.name.replace(/\.pdf$/i, `.${outputFormat.toLowerCase()}`);
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
  };


  // Opciones de conversión para PDF centralizadas en pdfConverters.js
  const PDF_CONVERSION_OPTIONS = ['DOCX', 'TXT', 'MD'];

  const getFileType = () => {
    if (!file) return [];
    if (file.name.toLowerCase().endsWith('.pdf')) return PDF_CONVERSION_OPTIONS;
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
                  <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} />
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <UploadCloud className="h-12 w-12" />
                    <p className="font-semibold">Arrastra y suelta tu archivo aquí</p>
                    <p className="text-sm">o haz clic para seleccionar</p>
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