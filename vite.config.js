import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Asegurarse de que PDF.js se cargue correctamente
      'pdfjs-dist': resolve(__dirname, 'node_modules/pdfjs-dist'),
    },
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
});
