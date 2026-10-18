import { defineConfig } from "vitest/config";

// Security-rules tests. Run against the Firebase emulators via `npm run test:rules`.
export default defineConfig({
  test: {
    include: ["tests/rules/**/*.test.ts"],
    environment: "node",
    testTimeout: 30000,
    hookTimeout: 60000,
    fileParallelism: false,
  },
});
