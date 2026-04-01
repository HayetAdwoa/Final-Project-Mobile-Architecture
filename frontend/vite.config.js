import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const authTarget = (env.VITE_AUTH_URL || env.VITE_AUTH_BASE_URL) && (env.VITE_AUTH_URL || env.VITE_AUTH_BASE_URL) !== 'undefined'
    ? (env.VITE_AUTH_URL || env.VITE_AUTH_BASE_URL)
    : 'http://localhost:4001'
  const incidentsTarget = env.VITE_INCIDENT_URL || 'http://localhost:4002'
  const dispatchTarget = env.VITE_DISPATCH_URL || 'http://localhost:4003'
  const analyticsTarget = env.VITE_ANALYTICS_URL || 'http://localhost:4004'
  const responderTarget = env.VITE_RESPONDER_URL || 'http://localhost:4005'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/auth': {
          target: authTarget,
          changeOrigin: true,
        },
        '/incidents': {
          target: incidentsTarget,
          changeOrigin: true,
        },
        '/vehicles': {
          target: dispatchTarget,
          changeOrigin: true,
        },
        '/ws': {
          target: dispatchTarget.replace(/^http/, 'ws'),
          changeOrigin: true,
          ws: true,
        },
        '/analytics': {
          target: analyticsTarget,
          changeOrigin: true,
        },
        '/responders': {
          target: responderTarget,
          changeOrigin: true,
        },
      }
    }
  }
})
