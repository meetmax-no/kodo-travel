import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @kodo/shared er rå TypeScript (ingen byggesteg) — Next transpilerer den inn.
  transpilePackages: ["@kodo/shared"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
