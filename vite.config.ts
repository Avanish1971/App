import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const buildVersion = String(Date.now());
function versionFile(): Plugin {
  return {
    name: 'version-file',
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: buildVersion }) });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), versionFile()],
  define: { __APP_VERSION__: JSON.stringify(buildVersion) },
  css: { transformer: 'postcss', minify: 'esbuild' },
  server: { port: 3000, host: true },
});
