import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',   // relative paths — critical for Chrome extensions
  build: {
    outDir: '../popup-dist',
    emptyOutDir: true,
    rollupOptions: {
      input: { popup: resolve(__dirname, 'index.html') },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
})
