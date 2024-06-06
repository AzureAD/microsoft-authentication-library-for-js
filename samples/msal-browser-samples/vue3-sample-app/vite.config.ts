import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dns from 'dns';

dns.setDefaultResultOrder('verbatim');

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
    server: {
        host: 'localhost',
        port: 3000,
    },
})
