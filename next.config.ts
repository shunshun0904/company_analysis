import type { NextConfig } from "next";

// 静的サイトとして書き出す（Vercel / GitHub Pages / 任意の静的ホスティングで配信可能）。
// GitHub Pages のサブパスで公開する場合は NEXT_PUBLIC_BASE_PATH=/company_analysis のように指定する。
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: basePath || undefined,
  images: { unoptimized: true },
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
