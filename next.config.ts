import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Явно фиксируем корень, чтобы Turbopack не брал чужой lockfile выше по дереву
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
