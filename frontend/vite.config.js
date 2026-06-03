import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  server: {
    proxy: {
      '/auth': 'http://localhost:8000',
      '/summary': 'http://localhost:8000',
      '/drafts': 'http://localhost:8000',
      '/send': 'http://localhost:8000',
    },
  },
})
