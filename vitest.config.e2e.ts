import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      '#common': path.resolve(__dirname, 'src/common'),
      '#config': path.resolve(__dirname, 'src/config'),
      '#db': path.resolve(__dirname, 'src/db'),
      '#generated': path.resolve(__dirname, 'src/generated'),
    },
  },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/src/generated/**'],
  },
});