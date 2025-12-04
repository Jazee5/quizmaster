import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(), // ✅ This was missing! That's why CSS crashed
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: false // Disable in dev to avoid caching issues
      },
      manifest: {
        name: 'QuizMaster - Student Quiz Platform',
        short_name: 'QuizMaster',
        description: 'Elevate learning with fun, interactive, and intelligent quizzes',
        theme_color: '#4F46E5',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,mp4,webm}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts',
            }
          }
        ]
      }
    })
  ]
})