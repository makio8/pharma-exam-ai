import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB（問題データが大きいため）
      },
      manifest: {
        name: '国試ノート - 薬剤師国家試験演習',
        short_name: '国試ノート',
        description: '付箋ベースの薬剤師国家試験過去問演習アプリ',
        theme_color: '#001529',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/react-router')) return 'vendor-react'
          if (id.includes('node_modules/antd') || id.includes('node_modules/@ant-design')) return 'vendor-antd'
          if (id.includes('node_modules/@supabase')) return 'vendor-supabase'
          // 問題データを年度別に分割
          if (id.includes('real-questions/exam-107')) return 'data-107'
          if (id.includes('real-questions/exam-108')) return 'data-108'
          if (id.includes('real-questions/exam-109')) return 'data-109'
          if (id.includes('real-questions/exam-110')) return 'data-110'
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
