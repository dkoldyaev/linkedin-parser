import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { resolveConfig } from '../build/config.mjs'

// EXT_MODE is set by extension/build/build.mjs; defaults to development for `npm run dev`.
const { apiBase } = resolveConfig(process.env.EXT_MODE || 'development')

export default defineConfig({
  plugins: [react()],
  base: './',   // relative paths — critical for Chrome extensions
  define: {
    __API_BASE__: JSON.stringify(apiBase),
  },
  build: {
    outDir: '../dist/popup',
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
