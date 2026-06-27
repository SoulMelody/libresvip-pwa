import type { PWAAssetsOptions } from 'vite-plugin-pwa'
import { basename } from "node:path"
import type { PreRenderedAsset } from "rolldown"
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
  server: {
    cors: true,
  },
  build: {
    rolldownOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (isWheelAsset(assetInfo)) {
            const wheelName = getWheelName(assetInfo)
            return wheelName ? `wheels/${wheelName}` : "wheels/[name][extname]"
          }
          return "assets/[name]-[hash][extname]"
        },
      },
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      pwaAssets,
      manifest: {
        name: 'LibreSVIP PWA',
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

function isWheelAsset(assetInfo: PreRenderedAsset): boolean {
  return getWheelName(assetInfo) !== null
}

function getWheelName(assetInfo: PreRenderedAsset): string | null {
  const sourceName = [
    ...assetInfo.originalFileNames,
    ...assetInfo.names,
    assetInfo.name ?? "",
  ].find((fileName) => fileName.endsWith(".whl"))
  return sourceName ? basename(sourceName) : null
}
