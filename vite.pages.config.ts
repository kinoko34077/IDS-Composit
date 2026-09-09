import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const pageNames = ['index', 'basic', 'validation', 'chise-preflight', 'consumer'];
const pageRoot = resolve(process.cwd(), 'examples');

export default defineConfig({
  root: 'examples',
  base: '/IDS-Composit/',
  build: {
    outDir: '../pages-dist',
    emptyOutDir: true,
    rollupOptions: {
      input: Object.fromEntries(pageNames.map((name) => [name, resolve(pageRoot, `${name}.html`)])),
    },
  },
});
