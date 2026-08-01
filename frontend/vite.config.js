import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBaseUrl = env.VITE_API_URL || ''
  const proxyTarget = apiBaseUrl ? apiBaseUrl.replace(/\/api\/?$/, '') : undefined

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: proxyTarget ? {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        }
      } : undefined
    }
  }
})
