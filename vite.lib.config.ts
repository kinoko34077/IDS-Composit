import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: 'src/public-api.ts',
      name: 'IdsComposit',
      formats: ['es'],
      fileName: 'ids-composit',
      cssFileName: 'ids-composit',
    },
  },
});
