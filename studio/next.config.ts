import path from 'node:path';
import type { NextConfig } from 'next';

const repoRoot = path.join(__dirname, '..');

const nextConfig: NextConfig = {
  // Every Studio page is signed-in and per-request, so Cache Components (static shells) buys nothing here.
  cacheComponents: false,
  // Allow importing ../data/seed-channels.json (and, from Phase 3, ../videos) from the repo root.
  outputFileTracingRoot: repoRoot,
  turbopack: {
    root: repoRoot,
    rules: {
      '*.css': { loaders: ['@tailwindcss/turbopack'], as: '*.css' },
    },
  },
  poweredByHeader: false,
};

export default nextConfig;
