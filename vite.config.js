import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    // Manejar extensiones .mjs
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.mjs': 'js',
      },
    },
    include: ['pdfjs-dist/build/pdf.mjs'],
  },
  server: {
    fs: {
      // Permitir servir archivos desde node_modules
      allow: ['..', 'node_modules'],
    },
  },
  build: {
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
            'mammoth',
            'docx',
          ]
        }
      },
    },
  },
});
