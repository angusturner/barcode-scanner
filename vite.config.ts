import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl() // Add SSL plugin instead of using server.https
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    },
  },
  server: {
    host: true, // Listen on all local IPs
    port: 3000,  // Changed to avoid conflict with Firebase hosting emulator
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  },
  // Make sure build output matches Firebase hosting configuration
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
