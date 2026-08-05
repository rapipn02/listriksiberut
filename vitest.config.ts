import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // `output: "standalone"` menyalin src/ ke .next/standalone — jangan ikut diuji.
    exclude: ["node_modules/**", ".next/**", "dist/**"],
  },
});
