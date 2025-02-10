import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    deps: {
      inline: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
    },
    mockReset: true,
  },
  resolve: {
    alias: {
      react: path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
      "react/jsx-dev-runtime": path.resolve(__dirname, "./node_modules/react/jsx-dev-runtime"),
    },
  },
  publicDir: "public",
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === "noise-worklet.js") {
            return "[name][extname]";
          }
          return "assets/[name]-[hash][extname]";
        },
      },
    },
  },
});
