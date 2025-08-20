import { defineConfig } from "vite";

export default defineConfig({
  assetsInclude: ["**/*.whl"],  // `*.whl` files should be handled as assets
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
})
