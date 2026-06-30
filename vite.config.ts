import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "strip-mediapipe-sourcemap-comments",
      transform(code, id) {
        if (id.includes("@mediapipe")) {
          return {
            code: code.replace(/\/\/# sourceMappingURL=\S+/g, ""),
            map: null,
          };
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
});
