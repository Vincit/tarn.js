import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    detectAsyncLeaks: true,
    testTimeout: 5000,
    slowTestThreshold: 10,
    setupFiles: ['./vitest.setup.js']
  }
});
