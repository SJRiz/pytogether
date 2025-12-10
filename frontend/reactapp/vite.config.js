import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa';
import path from "path"

// @vitejs/plugin-react

export default defineConfig({
  plugins: [react(), tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      devOptions: {
        enabled: true,
        type: 'module',
      },
      scope: '/ide/',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,tar}'],
      },
    }),
  ],

  resolve: {
    alias: {
      "comlink": path.resolve(__dirname, "node_modules/comlink/dist/esm/comlink.mjs")
    }
  },

  optimizeDeps: {
    exclude: ['pyodide']
  },

  worker: {
    format: 'es',
  },

  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
})
