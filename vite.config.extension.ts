import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite configuration dedicated for Chrome / Edge Extension (Manifest V3)
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist-extension',
    emptyOutDir: true,
  },
});

