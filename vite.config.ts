import { defineConfig } from "vite";
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  assetsInclude: ["**/*.whl"],  // `*.whl` files should be handled as assets
  base: "/libresvip-pwa/",
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.names[0]?.endsWith('.whl')) {  // `*.whl` file names should be used as is without attributing a hash
            return 'wheels/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      },
    },
  },
  optimizeDeps: {
    exclude: ["@stlite/browser"],  // The worker file must be excluded from the optimization
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        '**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2,ttf,otf,whl}',
      ],
      manifest: {
        name: 'LibreSVIP Stlite',
        short_name: 'LibreSVIP',
        icons: [
          {
            src: '/favicon.ico',
            sizes: '256x256',
            type: 'image/x-icon',
          },
        ]
      },
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2,ttf,otf,whl}',
        ],
        globIgnores: ['**/sw.js', '**/workbox-*.js'],
        maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
      },
    })
  ]
})
