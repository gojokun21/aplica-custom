// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/icon'],

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
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
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
