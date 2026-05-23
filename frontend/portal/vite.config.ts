import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    proxy: {
      '/portal': 'http://localhost:8000',
      '/auth': 'http://localhost:8000',
    },
  },
  resolve: {
    alias: {
      '@sipro/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
})
