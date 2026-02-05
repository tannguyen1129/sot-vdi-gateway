"use client"; // <--- QUAN TRỌNG: Thêm dòng này

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800">
      <h1 className="text-6xl font-bold text-blue-600">404</h1>
      <h2 className="text-2xl font-semibold mt-4">Không tìm thấy trang</h2>
      <p className="text-gray-500 mt-2">Trang bạn tìm kiếm không tồn tại hoặc đã bị di chuyển.</p>
      
      <Link 
        href="/"
        className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
      >
        Về trang chủ
      </Link>
    </div>
  );
}