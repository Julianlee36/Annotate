import { writeFileSync } from 'fs'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'generate-netlify-redirects',
      closeBundle() {
        // Create _redirects file in the build output directory
        writeFileSync('./dist/_redirects', '/* /index.html 200');
        console.log('✅ _redirects file generated');
      }
    }
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
