import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/icon-192.svg", "icons/icon-512.svg"],
      manifest: {
        name: "Killagain Food",
        short_name: "KillagainFood",
        description: "Cuisine antillaise intelligente + nutrition adaptee a ton frigo.",
        theme_color: "#0b2b45",
        background_color: "#041522",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/icons/icon-192.svg",
            sizes: "192x192",
            type: "image/svg+xml"
          },
          {
            src: "/icons/icon-512.svg",
            sizes: "512x512",
            type: "image/svg+xml"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"]
      }
    })
  ]
});
