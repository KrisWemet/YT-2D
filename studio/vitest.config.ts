import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
      // server-only throws outside a React Server Components build; tests run plain Node.
      'server-only': path.resolve(__dirname, 'tests/server-only-stub.ts'),
    },
  },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
});
