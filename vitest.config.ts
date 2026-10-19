import { defineConfig } from "vitest/config";
import path from "path";

// Fast unit tests (no emulators). Rules tests use vitest.rules.config.ts.
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
  },
});
