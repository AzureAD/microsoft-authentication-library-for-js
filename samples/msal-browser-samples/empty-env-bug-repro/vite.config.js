import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  server: {
    port: 3000
  },
  resolve: {
    alias: {
      '/lib': path.resolve(__dirname, '../../../lib/msal-browser/lib')
    }
  }
});
