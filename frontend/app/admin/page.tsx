"use client";
import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800 border-l-8 border-blue-600 pl-4">
            TỔNG QUAN HỆ THỐNG
        </h1>
        
        <div className="grid md:grid-cols-3 gap-6">
            {/* Card Sinh viên */}
            <Link href="/admin/students" className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition group">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-500 font-bold">SINH VIÊN</h3>
                    <span className="p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition">👥</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">Quản lý</p>
                <p className="text-sm text-gray-400 mt-2">Xem danh sách & Import</p>
            </Link>

            {/* Card Máy ảo */}
            <Link href="/admin/vms" className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition group">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-500 font-bold">MÁY ẢO (VDI)</h3>
                    <span className="p-2 bg-green-100 text-green-600 rounded-lg group-hover:bg-green-600 group-hover:text-white transition">🖥️</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">Cấu hình</p>
                <p className="text-sm text-gray-400 mt-2">IP Pool & Trạng thái</p>
            </Link>

            {/* Card Giám sát */}
            <Link href="/admin/monitor" className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition group">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-500 font-bold">GIÁM SÁT THI</h3>
                    <span className="p-2 bg-red-100 text-red-600 rounded-lg group-hover:bg-red-600 group-hover:text-white transition">👁️</span>
                </div>
                <p className="text-3xl font-bold text-gray-800">Live View</p>
                <p className="text-sm text-gray-400 mt-2">Theo dõi màn hình thí sinh</p>
            </Link>
        </div>
      </div>
    </div>
  );
}