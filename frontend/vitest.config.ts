import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      react: path.resolve(import.meta.dirname, 'node_modules/react'),
      'react-dom': path.resolve(import.meta.dirname, 'node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(import.meta.dirname, 'node_modules/react/jsx-runtime'),
      'react/jsx-dev-runtime': path.resolve(import.meta.dirname, 'node_modules/react/jsx-dev-runtime'),
      '@blueprint/ui-kit': path.resolve(import.meta.dirname, '../packages/ui-kit/src/index.ts'),
      '@ui-kit': path.resolve(import.meta.dirname, '../packages/ui-kit/src/index.ts'),
    },
    dedupe: ['react', 'react-dom'],
  },
  test: {
    environment: 'jsdom',
    include: [
      'src/middleware.test.js',
      'src/app/**/*.test.{js,jsx,ts,tsx}',
      'src/api_v2_mercure_seam.test.jsx',
      '../packages/ui-kit/src/**/*.test.{ts,tsx}',
    ],
    globals: true,
  },
});
