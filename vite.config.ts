import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served from https://<user>.github.io/planfoy/, so assets need that prefix.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/planfoy/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
  },
});
