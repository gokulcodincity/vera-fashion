import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

export default defineConfig({
  root,
  plugins: [react(), tailwindcss()],
  build: {
    ssr: path.join(here, 'ssr-entry.jsx'),
    outDir: path.join(here, 'out'),
    emptyOutDir: true,
    minify: false,
  },
});
