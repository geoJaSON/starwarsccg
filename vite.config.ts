import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // Set VITE_BASE=/your-subpath/ when deploying under a project subpath
  // (e.g. GitHub Pages). Defaults to root.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    // Auto-open the browser locally, but stay quiet in CI / headless envs.
    open: !process.env.CI,
  },
  build: {
    target: 'esnext',
    sourcemap: true,
  },
});
