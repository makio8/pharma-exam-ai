import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  define: {
    // dev-tools のPdfViewerで /@fs/ 経由のPDFアクセスに使用
    __PDF_ROOT__: JSON.stringify(path.resolve(__dirname, 'data/pdfs')),
    __REPORTS_ROOT__: JSON.stringify(path.resolve(__dirname, 'reports')),
    // pdfjs-dist の CMap（日本語フォント文字マップ）パス
    __CMAPS_ROOT__: JSON.stringify(path.resolve(__dirname, 'node_modules/pdfjs-dist/cmaps')),
  },
  server: {
    fs: {
      allow: [
        __dirname,  // プロジェクトルート（index.html, src/ 等のアクセスに必須）
        path.resolve(__dirname, 'data/pdfs'),
        path.resolve(__dirname, 'reports'),
      ],
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB（問題データが大きいため）
        navigateFallbackDenylist: [/^\/dev-tools/],
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
          // 問題データを年度別に分割（100-110回）
          if (id.includes('question-topic-map')) return 'data-topic-map'
          if (id.includes('exam-blueprint')) return 'data-blueprint'
          if (id.includes('exemplars')) return 'data-exemplars'
          if (id.includes('real-questions/exam-100')) return 'data-100'
          if (id.includes('real-questions/exam-101')) return 'data-101'
          if (id.includes('real-questions/exam-102')) return 'data-102'
          if (id.includes('real-questions/exam-103')) return 'data-103'
          if (id.includes('real-questions/exam-104')) return 'data-104'
          if (id.includes('real-questions/exam-105')) return 'data-105'
          if (id.includes('real-questions/exam-106')) return 'data-106'
          if (id.includes('real-questions/exam-107')) return 'data-107'
          if (id.includes('real-questions/exam-108')) return 'data-108'
          if (id.includes('real-questions/exam-109')) return 'data-109'
          if (id.includes('real-questions/exam-110')) return 'data-110'
          if (id.includes('real-questions/exam-111')) return 'data-111'
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
