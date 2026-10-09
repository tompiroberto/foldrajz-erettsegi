/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const EXAM_DIR = fileURLToPath(new URL('./docs/erettsegi-feladatsorok', import.meta.url));

/**
 * Serves the downloaded exam PDFs at /exams/<file>.pdf without duplicating them
 * into public/: straight from docs/ in dev, copied into dist/exams on build.
 */
function examPdfs(): Plugin {
  return {
    name: 'exam-pdfs',
    configureServer(server) {
      server.middlewares.use('/exams', (req, res, next) => {
        const name = decodeURIComponent((req.url ?? '').split('?')[0]!.replace(/^\//, ''));
        const file = path.join(EXAM_DIR, path.basename(name));
        if (!name.endsWith('.pdf') || !fs.existsSync(file)) return next();
        res.setHeader('Content-Type', 'application/pdf');
        fs.createReadStream(file).pipe(res);
      });
    },
    writeBundle(options) {
      const out = path.join(options.dir ?? 'dist', 'exams');
      fs.mkdirSync(out, { recursive: true });
      for (const f of fs.readdirSync(EXAM_DIR)) if (f.endsWith('.pdf')) fs.copyFileSync(path.join(EXAM_DIR, f), path.join(out, f));
    },
  };
}

// GitHub Pages serves the site under /<repo>/; the deploy workflow sets BASE_PATH. Locally and on Netlify it is '/'.
const BASE = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base: BASE,
  plugins: [
    examPdfs(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'Földrajz emelt érettségi',
        short_name: 'Földrajz',
        description: 'Topográfia és elmélet – gyakorló app az emelt szintű földrajz érettségire',
        lang: 'hu',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        background_color: '#F7F4EC',
        theme_color: '#0E7C86',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell + every data file, so the app works offline after the first visit.
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
        // Full past exam papers (~10 MB) are cached when first opened, not up front.
        globIgnores: ['**/assets/*_tavasz-*.js', '**/assets/*_osz-*.js', '**/assets/*_februar-*.js', '**/exams/**'],
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
        navigateFallback: `${BASE}index.html`,
        navigateFallbackDenylist: [/\/exams\//],
        // The original exam PDFs (~90 MB) are not precached: each is cached when first opened.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/exams/'),
            handler: 'CacheFirst',
            options: { cacheName: 'exam-pdfs', expiration: { maxEntries: 100 } },
          },
          {
            urlPattern: ({ url }) => /\/assets\/\d{4}_(tavasz|osz|februar)-.*\.js$/.test(url.pathname),
            handler: 'CacheFirst',
            options: { cacheName: 'exam-papers', expiration: { maxEntries: 60 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'node',
  },
});
