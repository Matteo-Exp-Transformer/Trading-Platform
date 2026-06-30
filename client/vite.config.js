import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite + React. La sezione `test` configura Vitest (stessa toolchain del client).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy verso il server Express in dev: le chiamate /api vanno a localhost:3001.
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: './src/test/setup.js',
    css: true,
  },
});
