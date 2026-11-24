import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^react$/, replacement: path.resolve(import.meta.dirname, 'node_modules/react/index.js') },
      { find: /^react-dom$/, replacement: path.resolve(import.meta.dirname, 'node_modules/react-dom/index.js') },
      { find: /^react-dom\/(.*)$/, replacement: path.resolve(import.meta.dirname, 'node_modules/react-dom/$1') },
      { find: /^react\/(.*)$/, replacement: path.resolve(import.meta.dirname, 'node_modules/react/$1') },
      { find: '@blueprint/ui-kit', replacement: path.resolve(import.meta.dirname, '../packages/ui-kit/src/index.ts') },
      { find: '@ui-kit', replacement: path.resolve(import.meta.dirname, '../packages/ui-kit/src/index.ts') },
    ],
    dedupe: ['react', 'react-dom'],
  },
  server: {
    deps: {
      inline: [/@blueprint\/ui-kit/, /lucide-react/, /@radix-ui/],
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['../packages/ui-kit/src/vitest-env.d.ts'],
    include: [
      'src/**/*.test.{ts,tsx}',
    ],
    globals: true,
  },
});
