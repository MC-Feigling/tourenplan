export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@nuxt/ui', '@nuxtjs/tailwindcss', '@vite-pwa/nuxt'],
  colorMode: {
    preference: 'dark',
    fallback: 'dark',
  },
  tailwindcss: {
    cssPath: '~/assets/css/ui.css',
    experimental: {
      tailwindcss4: true,
    },
  },
  css: ['~/assets/css/main.css'],
  routeRules: {
    '/api/**': { cors: true },
    '/driver/**': { ssr: true },
    '/admin/**': { ssr: true },
  },
  typescript: {
    strict: true,
    typeCheck: true,
  },
  runtimeConfig: {
    databaseUrl:
      process.env.NUXT_DATABASE_URL ||
      process.env.DATABASE_URL ||
      'postgresql://tourenplan:tourenplan_dev@127.0.0.1:5432/tourenplan',
    jwtSecret: process.env.NUXT_JWT_SECRET || '',
    orsApiKey: process.env.NUXT_ORS_API_KEY || '',
    bootstrapAdminEmail: process.env.NUXT_BOOTSTRAP_ADMIN_EMAIL || 'admin@localhost.local',
    bootstrapAdminPassword: process.env.NUXT_BOOTSTRAP_ADMIN_PASSWORD || '',
    public: {
      appName: 'Tourenplan',
    },
  },
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('maplibre-gl')) {
              return 'maplibre'
            }
          },
        },
      },
    },
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Tourenplan Fahrer',
      short_name: 'Tourenplan',
      description: 'Touren und Fahrplan für Busfahrer',
      theme_color: '#0f172a',
      background_color: '#0f172a',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/driver',
      scope: '/',
      categories: ['business', 'productivity'],
      icons: [
        { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
      ],
    },
    workbox: {
      navigateFallback: '/driver',
      globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
    },
    devOptions: {
      enabled: true,
    },
  },
  app: {
    head: {
      title: 'Tourenplan',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Tourenplanung für Busunternehmen' },
        { name: 'theme-color', content: '#0f172a' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'mobile-web-app-capable', content: 'yes' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'apple-touch-icon', href: '/favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&display=swap',
        },
      ],
    },
  },
  ui: {
    fonts: false,
  },
})
