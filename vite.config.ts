import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

function fullKnownIndexDevAsset(): Plugin {
  return {
    name: 'ids-composit-full-known-index-dev',
    configureServer(server) {
      server.middlewares.use('/data/known-index-v0.2.json', async (_request, response, next) => {
        try {
          const source = await readFile(resolve(process.cwd(), 'data/known/generated/known-index-v0.2.json'), 'utf8');
          response.statusCode = 200;
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          response.end(source);
        } catch {
          next();
        }
      });
    },
  };
}

export default defineConfig({
  root: 'examples',
  plugins: [fullKnownIndexDevAsset()],
  server: {
    fs: {
      allow: ['..'],
    },
  },
});
