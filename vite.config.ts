import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
  plugins: [
    react(),
    tailwind(),
    VitePWA({
      registerType: "prompt",
      manifest: {
        name: "SET",
        short_name: "SET",
        display: "standalone",
        start_url: "/",
        theme_color: "#F7F7F7",
        background_color: "#F7F7F7",
        icons: [
          { src: "/icons/192.png", sizes: "192x192", type: "image/png" },
          {
            src: "/icons/512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg}"],
        runtimeCaching: [
          {
            urlPattern:
              /https:\/\/(cdn.jsdelivr.net|tessdata.projectnaptha.com)\//,
            handler: "CacheFirst",
            options: {
              cacheName: "ocr-resources",
              expiration: { maxEntries: 30, maxAgeSeconds: 31536000 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
});
