import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import Header from './components/Header';
import FileConverter from './components/FileConverter';
import BatchImageConverter from './components/BatchImageConverter';
// import YouTubeDownloader from './components/YouTubeDownloader'; // Deshabilitado temporalmente - YouTube bloquea IPs de datacenter
import Features from './components/Features';
import SupportedFormats from './components/SupportedFormats';
import Roadmap from './components/Roadmap';
import Footer from './components/Footer';
import { Toaster } from './components/ui/toaster';
import { Loader2, FileText, Image } from 'lucide-react';
// import { Youtube } from 'lucide-react'; // Deshabilitado temporalmente

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('single'); // 'single' or 'batch' (youtube deshabilitado)

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
            {/* Tabs for switching between single and batch conversion */}
            <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <div className="flex justify-center mb-8">
                  <div className="inline-flex flex-col sm:flex-row rounded-lg bg-muted p-1 shadow-md w-full sm:w-auto max-w-sm sm:max-w-none">
                    <button
                      onClick={() => setActiveTab('single')}
                      className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-md font-medium transition-all text-sm sm:text-base ${
                        activeTab === 'single'
                          ? 'bg-background text-primary shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="whitespace-nowrap">Conversión Individual</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('batch')}
                      className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-md font-medium transition-all text-sm sm:text-base ${
                        activeTab === 'batch'
                          ? 'bg-background text-primary shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Image className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="whitespace-nowrap">Conversión por Lotes</span>
                    </button>
                    {/* YouTube Downloader deshabilitado temporalmente - YouTube bloquea IPs de datacenter
                    <button
                      onClick={() => setActiveTab('youtube')}
                      className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-3 rounded-md font-medium transition-all text-sm sm:text-base ${
                        activeTab === 'youtube'
                          ? 'bg-background text-primary shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Youtube className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="whitespace-nowrap">YouTube Downloader</span>
                    </button>
                    */}
                  </div>
                </div>

                {/* Content based on active tab */}
                <AnimatePresence mode="wait">
                  {activeTab === 'single' ? (
                    <motion.div
                      key="single"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <FileConverter />
                    </motion.div>
                  ) : activeTab === 'batch' ? (
                    <motion.div
                      key="batch"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <BatchImageConverter />
                    </motion.div>
                  ) : null}
                  {/* YouTube Downloader deshabilitado temporalmente
                  ) : (
                    <motion.div
                      key="youtube"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <YouTubeDownloader />
                    </motion.div>
                  )}
                  */}
                </AnimatePresence>
              </div>
            </section>
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