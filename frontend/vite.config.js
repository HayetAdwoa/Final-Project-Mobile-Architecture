import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': {
        target: 'http://localhost:4001',
        changeOrigin: true,
      },
      '/incidents': {
        target: 'http://localhost:4002',
        changeOrigin: true,
      },
      '/vehicles': {
        target: 'http://localhost:4003',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:4003',
        changeOrigin: true,
        ws: true,
      },
      '/analytics': {
        target: 'http://localhost:4004',
        changeOrigin: true,
      },
      '/responders': {
        target: 'http://localhost:4005',
        changeOrigin: true,
      },
    }
  }
})
