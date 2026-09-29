import { defineConfig } from "eslint/config";
import next from "eslint-config-next";

export default defineConfig([
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "scratch/**",
      "n8n/**",
      "*.config.*",
    ],
  },
  {
    extends: [...next],
    rules: {
      "no-console": ["warn", { allow: ["warn", "error", "info"] }]
    }
  }
]);
