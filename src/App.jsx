import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import FileConverter from './components/FileConverter';
import Features from './components/Features';
import SupportedFormats from './components/SupportedFormats';
import Roadmap from './components/Roadmap';
import Footer from './components/Footer';
import { Toaster } from './components/ui/toaster';
import { Loader2 } from 'lucide-react';

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Helmet>
        <title>Files2Any - Conversor de Archivos Gratuito y Seguro</title>
        <meta name="description" content="Convierte documentos, imágenes, audio y video de forma rápida y segura. Files2Any es tu herramienta de conversión online gratuita, sin anuncios y sin registro." />
      </Helmet>
      
      <AnimatePresence>
        {loading && (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
          >
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium text-muted-foreground">Cargando Files2Any...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && (
        <div className={`min-h-screen bg-background font-sans antialiased ${theme}`}>
          <Header theme={theme} setTheme={setTheme} />
          <main>
            <FileConverter />
            <Features />
            <SupportedFormats />
            <Roadmap />
          </main>
          <Footer />
          <Toaster />
        </div>
      )}
    </>
  );
}

export default App;