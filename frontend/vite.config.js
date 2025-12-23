import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true, // ESTO ES VITAL: permite que localtunnel entre sin error 403
    proxy: {
      '/api': {
        target: 'http://backend_api:4000',
        changeOrigin: true,
      }
    }
  }
})