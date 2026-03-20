import { defineConfig } from "vite";
import { resolve } from "path";
import path from "path";

export default defineConfig({
  build: {
    outDir: "src/Public/dist",
    manifest: true,
    cssCodeSplit: true,
    minify: true,
    chunkSizeWarningLimit: 600, // Increase limit to 600kb to suppress warning
    rollupOptions: {
      input: {
        seamless: resolve(__dirname, "src/js/seamless.js"),
      },
      output: {
        inlineDynamicImports: false,
        entryFileNames: "js/[name].js",
        chunkFileNames: "js/[name].js",
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith(".css")) {
            return "css/[name].css";
          }

          // Handle Font Awesome fonts
          if (/\.(woff2?|eot|ttf|otf|svg)(\?.*)?$/.test(assetInfo.name || "")) {
            return "fonts/[name][extname]"; // <-- Use [extname] not .[ext]
          }

          if (/\.(png|jpe?g|svg)$/.test(assetInfo.name || "")) {
            return "images/[name][extname]";
          }

          return "assets/[name][extname]";
        },
        manualChunks(id) {
          if (id.includes("node_modules/@toast-ui/calendar"))
            return "toastUICalendar";
          if (id.includes("node_modules/add-to-calendar-button"))
            return "addToCalendar";
          if (id.includes("node_modules/slick-carousel"))
            return "slickCarousel";
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  server: {
    origin: "http://localhost:10013",
    strictPort: true,
    port: 10013,
  },
  optimizeDeps: {
    include: [
      "@toast-ui/calendar",
      "tui-code-snippet",
      "jquery",
      "@fortawesome/fontawesome-free",
      "slick-carousel",
    ],
  },
});
