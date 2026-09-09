import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

const pageNames = ['index', 'basic', 'validation', 'chise-preflight', 'consumer'];
const pageRoot = resolve(process.cwd(), 'examples');

function fullKnownIndexAsset(): Plugin {
  return {
    name: 'ids-composit-full-known-index',
    async generateBundle() {
      const source = await readFile(resolve(process.cwd(), 'data/known/generated/known-index-v0.2.json'), 'utf8');
      this.emitFile({ type: 'asset', fileName: 'data/known-index-v0.2.json', source });
    },
  };
}

export default defineConfig({
  root: 'examples',
  base: '/IDS-Composit/',
  plugins: [fullKnownIndexAsset()],
  build: {
    outDir: '../pages-dist',
    emptyOutDir: true,
    rollupOptions: {
      input: Object.fromEntries(pageNames.map((name) => [name, resolve(pageRoot, `${name}.html`)])),
    },
  },
});
