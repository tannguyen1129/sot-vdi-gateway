import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false, // QUAN TRỌNG: Sửa true thành false
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://umt_backend:3000/:path*',
      },
    ];
  },
};

export default nextConfig;