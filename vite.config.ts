import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Served from https://<user>.github.io/Planfoy/, so assets need that prefix.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/Planfoy/',
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
  },
});
