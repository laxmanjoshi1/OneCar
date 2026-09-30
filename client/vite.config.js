import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Requests to /api are forwarded to the Express server, so the browser never needs the SQL details.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:4000' } },
})
