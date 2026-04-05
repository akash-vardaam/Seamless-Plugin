import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Vite config for the Seamless React WordPress plugin
// Build output goes to ../../plugin/react-build/dist/
// so that replacing this folder is all that's needed to deploy.
export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  build: {
    outDir: '../plugin/react-build/dist',
    emptyOutDir: true,
    // Generate hashed filenames so the PHP enqueue auto-picks the latest
    rollupOptions: {
      output: {
        entryFileNames: 'assets/index-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/index-[hash][extname]',
      },
    },
  },

  // Dev server – not required by WP, but handy for local development
  server: {
    port: 5174,
    cors: true,
  },
});
