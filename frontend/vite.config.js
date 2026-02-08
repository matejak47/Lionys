import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      usePolling: true, // Nutné pro Docker na Windows, aby fungoval Hot Reload
    },
    host: true, // Otevře přístup zvenku
    strictPort: true,
    port: 5173, 
  }
})