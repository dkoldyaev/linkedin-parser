import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Vite does not load .env into the config itself; the shared .env lives in the repo root.
  // Prefix '' loads all vars — safe here, they are only used in Node, not exposed to the client.
  const env = loadEnv(mode, path.resolve(import.meta.dirname, '..'), '')

  if (!env.APP_URL) {
    throw new Error('Strict Configuration Error: APP_URL is not set in .env')
  }

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: env.APP_URL,
          changeOrigin: true,
        },
      },
    },
  }
})
