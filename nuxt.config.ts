export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: false },
  nitro: {
    preset: 'vercel'
  },
  modules: ['@vite-pwa/nuxt'],
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Cartera Valentin',
      short_name: 'Cartera',
      description: 'Carga rápida de ingresos y egresos en Pesos, Dólares y Crypto',
      theme_color: '#0f1115',
      background_color: '#0f1115',
      display: 'standalone',
      start_url: '/',
      icons: [
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}']
    },
    devOptions: {
      enabled: false
    }
  },
  app: {
    head: {
      viewport: 'width=device-width, initial-scale=1, maximum-scale=1'
    }
  }
})
