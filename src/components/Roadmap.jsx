import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, Globe, Code } from 'lucide-react';

const roadmapItems = [
  {
    icon: <Rocket className="h-8 w-8 text-white" />,
    title: 'Fase 1: MVP',
    description: 'Lanzamiento inicial con conversiones básicas (documentos e imágenes). Interfaz simple y funcional.',
    status: 'Completado',
    color: 'bg-green-500'
  },
  {
    icon: <Code className="h-8 w-8 text-white" />,
    title: 'Fase 2: Expansión de Formatos',
    description: 'Añadir soporte para audio, video y formatos más complejos. Optimización del motor de conversión.',
    status: 'En Progreso',
    color: 'bg-blue-500'
  },
  {
    icon: <Globe className="h-8 w-8 text-white" />,
    title: 'Fase 3: Internacionalización',
    description: 'Traducción de la plataforma a inglés y otros idiomas para alcanzar una audiencia global.',
    status: 'Próximamente',
    color: 'bg-gray-500'
  },
];

const Roadmap = () => {
  return (
    <section id="roadmap" className="py-20 bg-secondary/50 dark:bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Nuestro Roadmap</h2>
          <p className="mt-4 text-lg text-muted-foreground">El futuro de Files2Any es brillante y estamos trabajando para mejorarlo.</p>
        </div>
        <div className="relative">
          <div className="absolute left-1/2 h-full w-0.5 bg-border -translate-x-1/2 hidden md:block"></div>
          {roadmapItems.map((item, index) => (
            <motion.div
              key={index}
              className="mb-8 flex justify-between items-center w-full"
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <div className={`hidden md:block w-5/12 ${index % 2 === 0 ? 'text-right' : ''}`}></div>
              <div className="z-10 flex items-center justify-center w-12 h-12 rounded-full shadow-lg shrink-0" style={{ backgroundColor: 'var(--background)' }}>
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${item.color}`}>
                  {item.icon}
                </div>
              </div>
              <div className="w-full md:w-5/12 bg-card p-6 rounded-lg shadow-md">
                <span className={`text-sm font-semibold px-3 py-1 rounded-full text-white ${item.color}`}>{item.status}</span>
                <h3 className="mt-3 text-xl font-bold">{item.title}</h3>
                <p className="mt-2 text-muted-foreground">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Roadmap;