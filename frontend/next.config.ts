import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Quan trọng: Tắt Strict Mode để tránh lỗi connect 2 lần
  reactStrictMode: false, 
  
  // XÓA HẾT PHẦN REWRITES, để trống hoặc xóa hàm async rewrites()
};

export default nextConfig;