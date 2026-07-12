import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "strip-mediapipe-sourcemap-comments",
      enforce: "pre",
      load(id) {
        if (id.includes("@mediapipe")) {
          try {
            const code = fs.readFileSync(id, "utf-8");
            return {
              code: code.replace(/\/\/# sourceMappingURL=\S+/g, ""),
              map: null,
            };
          } catch {
            return null;
          }
        }
      },
    },
  ],
  optimizeDeps: {
    exclude: ["@mediapipe/tasks-vision"],
  },
  server: {
    sourcemapIgnoreList: (sourcePath) => sourcePath.includes("@mediapipe"),
  },
  base: "/",
});
