import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: '/anti-fraud-shield/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    host: true,
  },
});
