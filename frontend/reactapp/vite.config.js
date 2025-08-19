import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// @vitejs/plugin-react

export default defineConfig({
  plugins: [react(), tailwindcss(),],
})