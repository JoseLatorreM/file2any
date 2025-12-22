import React from 'react';
import { motion } from 'framer-motion';
import { FileText, FileImage, FileAudio, FileVideo, Box, Hash, Wrench } from 'lucide-react';

const formatCategories = [
  {
    name: 'Documentos',
    icon: <FileText className="h-8 w-8 text-blue-500" />,
    formats: ['PDF', 'DOCX', 'XLSX', 'PPTX', 'CSV', 'JSON', 'XML'],
  },
  {
    name: 'Imágenes',
    icon: <FileImage className="h-8 w-8 text-green-500" />,
    formats: ['JPG', 'PNG', 'GIF', 'WEBP', 'SVG', 'BMP'],
  },
  {
    name: 'Audio',
    icon: <FileAudio className="h-8 w-8 text-purple-500" />,
    formats: ['MP3', 'WAV', 'AAC', 'FLAC', 'OGG'],
  },
  {
    name: 'Video',
    icon: <FileVideo className="h-8 w-8 text-red-500" />,
    formats: ['MP4', 'AVI', 'MOV', 'MKV', 'WEBM'],
  },
  {
    name: 'Modelos 3D',
    icon: <Box className="h-8 w-8 text-orange-500" />,
    formats: ['OBJ', 'STL', '3MF', 'AMF'],
  },
  {
    name: 'Hash & Cripto',
    icon: <Hash className="h-8 w-8 text-slate-500" />,
    formats: ['SHA-256', 'MD5', 'SHA-512', 'SHA-1', 'SHA3'],
  },
  {
    name: 'Herramientas',
    icon: <Wrench className="h-8 w-8 text-yellow-500" />,
    formats: ['Recorte Audio', 'Frames GIF', 'Metadatos', 'Generador QR', 'Codigo de Barras', 'Generador de UUIDs', 'Creador de Gifs', 'Generador de Contraseñas', 'Generador de Proxies'],
  },
];

const SupportedFormats = () => {
  return (
    <section id="formats" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Formatos Soportados</h2>
          <p className="mt-4 text-lg text-muted-foreground">Cubrimos una amplia gama de formatos para tus necesidades.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {formatCategories.map((category, index) => (
            <motion.div
              key={index}
              className="bg-card border rounded-lg p-6"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <div className="flex items-center gap-4 mb-4">
                {category.icon}
                <h3 className="text-xl font-semibold">{category.name}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {category.formats.map((format) => (
                  <span key={format} className="bg-secondary text-secondary-foreground text-xs font-medium px-2.5 py-1 rounded-full">
                    {format}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SupportedFormats;