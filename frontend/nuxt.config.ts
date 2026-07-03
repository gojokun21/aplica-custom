// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/icon', '@nuxtjs/i18n'],

  i18n: {
    strategy: 'prefix_except_default',
    defaultLocale: 'ro',
    baseUrl: 'https://aplica.md',
    lazy: true,
    locales: [
      { code: 'ro', name: 'Română', language: 'ro-MD', file: 'ro.json' },
      { code: 'en', name: 'English', language: 'en-US', file: 'en.json' },
      { code: 'ru', name: 'Русский', language: 'ru-RU', file: 'ru.json' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'aplica_locale',
      fallbackLocale: 'ro',
      redirectOn: 'root',
      alwaysRedirect: false,
    },
    // Căi traduse per limbă (SEO): RO în română, EN în engleză, RU translit.
    customRoutes: 'config',
    pages: {
      talent: { ro: '/talente', en: '/talent', ru: '/spetsialisti' },
      'talent-userId': {
        ro: '/talente/[userId]',
        en: '/talent/[userId]',
        ru: '/spetsialisti/[userId]',
      },
      'utilizator-slug': {
        ro: '/utilizator/[slug]',
        en: '/user/[slug]',
        ru: '/specialist/[slug]',
      },
      jobs: { ro: '/proiecte', en: '/projects', ru: '/proekty' },
      'jobs-new': { ro: '/proiecte/nou', en: '/projects/new', ru: '/proekty/novyy' },
      'jobs-id': { ro: '/proiecte/[id]', en: '/projects/[id]', ru: '/proekty/[id]' },
      'jobs-id-applicants': {
        ro: '/proiecte/[id]/aplicanti',
        en: '/projects/[id]/applicants',
        ru: '/proekty/[id]/otkliki',
      },
    },
    bundle: { optimizeTranslationDirective: false },
  },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        // Nu urmări asset-urile statice mari (TinyMCE ~272 fișiere, video) —
        // altfel watcher-ul pe Windows „pâlpâie" și declanșează HMR/rebuild în buclă.
        ignored: ['**/public/tinymce/**', '**/public/*.mp4'],
      },
    },
  },

  // Nuxt: ignoră aceleași căi la scanare/watch.
  ignore: ['public/tinymce/**', 'public/*.mp4'],

  app: {
    head: {
      title: 'aplica — Angajează talente. Găsește proiecte.',
      htmlAttrs: { lang: 'ro' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            'aplica conectează clienți cu freelanceri de top. Postează un proiect sau găsește-ți următorul job în minute.',
        },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..600&family=Onest:wght@400..800&display=swap',
        },
      ],
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001',
    },
  },
});
