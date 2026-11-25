import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: /^@blueprint\/ui-kit$/,
        replacement: path.resolve(import.meta.dirname, '../packages/ui-kit/src/index.ts'),
      },
      {
        find: /^@blueprint\/ui-kit\/styles\.css$/,
        replacement: path.resolve(import.meta.dirname, '../packages/ui-kit/src/tokens/tokens.css'),
      },
      {
        find: /^@ui-kit$/,
        replacement: path.resolve(import.meta.dirname, '../packages/ui-kit/src/index.ts'),
      },
    ],
    dedupe: ['react', 'react-dom'],
  },
  server: {
    allowedHosts: true,
    fs: {
      allow: [path.resolve(import.meta.dirname, '..')],
    },
  },
  preview: {
    allowedHosts: true,
  },
});
