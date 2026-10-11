import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Har build ka ek alag version number (build ke waqt ka time)
const buildVersion = String(Date.now());

// Build ke saath dist/version.json bana deta hai (UpdateBanner isse check karta hai)
function versionFile(): Plugin {
  return {
    name: 'version-file',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ version: buildVersion }),
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), versionFile()],
  define: {
    __APP_VERSION__: JSON.stringify(buildVersion),
  },
  // Server par ye CSS settings pehle se thi, isliye rakhi hain
  css: {
    transformer: 'postcss',
    minify: 'esbuild',
  },
  server: {
    port: 3000,
    host: true,
  },
});