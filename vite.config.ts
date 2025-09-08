import type { PWAAssetsOptions } from 'vite-plugin-pwa'
import { defineConfig } from "vite"
import { VitePWA } from 'vite-plugin-pwa'

const pwaAssets: PWAAssetsOptions = process.env.INLINE_PWA_ASSETS
  ? {
      image: 'public/source-test.png',
    }
  : {
      config: true,
      overrideManifestIcons: true,
    }

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
      pwaAssets,
      manifest: {
        name: 'LibreSVIP Stlite',
        short_name: 'LibreSVIP',
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
