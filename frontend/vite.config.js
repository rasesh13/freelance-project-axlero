import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three')) return 'vendor-three';
            if (id.includes('gsap')) return 'vendor-gsap';
            if (id.includes('lucide-react')) return 'vendor-lucide';
            if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
            return 'vendor-deps';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
