import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Сайт живёт на GitHub Pages по адресу /Sophie-Roman_Art_Gallery/.
  // При переезде на свой домен поменять на '/'.
  base: '/Sophie-Roman_Art_Gallery/',
  server: {
    port: 3000,
  },
})
