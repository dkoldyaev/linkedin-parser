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
    setupFiles: ['../packages/ui-kit/src/vitest-env.d.ts'],
    include: [
      'src/**/*.test.{ts,tsx}',
    ],
    globals: true,
  },
});
