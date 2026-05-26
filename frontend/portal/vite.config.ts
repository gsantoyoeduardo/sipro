import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    proxy: {
      '/auth': 'http://localhost:8000',
      '/empresa': 'http://localhost:8000',
      '/auditorias': 'http://localhost:8000',
      '/permisos': 'http://localhost:8000',
      '/roles': 'http://localhost:8000',
      '/usuarios': 'http://localhost:8000',
    },
  },
})
