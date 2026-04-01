import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return defineConfig({
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/auth': {
          target: env.VITE_AUTH_URL || 'http://localhost:4001',
          changeOrigin: true,
        },
        '/incidents': {
          target: env.VITE_INCIDENT_URL || 'http://localhost:4002',
          changeOrigin: true,
        },
        '/vehicles': {
          target: env.VITE_DISPATCH_URL || 'http://localhost:4003',
          changeOrigin: true,
        },
        '/ws': {
          target: env.VITE_WS_DISPATCH_URL || 'ws://localhost:4003',
          changeOrigin: true,
          ws: true,
        },
        '/analytics': {
          target: env.VITE_ANALYTICS_URL || 'http://localhost:4004',
          changeOrigin: true,
        },
        '/responders': {
          target: env.VITE_RESPONDER_URL || 'http://localhost:4005',
          changeOrigin: true,
        },
      }
    }
  })
}
