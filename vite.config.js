/**
 * Vite Configuration for Cube Arena Infinity
 *
 * Basic Vite setup for a vanilla JS Three.js game.
 * No framework needed — just fast dev server and optimized builds.
 */
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  server: {
    open: true,
    port: 3000,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
