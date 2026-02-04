"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans flex flex-col">
      
      {/* HERO SECTION */}
      <section className="relative flex-grow flex items-center justify-center py-20 overflow-hidden">
        {/* Background Effect */}
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://umt.edu.vn/uploads/images/campus/campus-1.jpg')] bg-cover bg-center opacity-5 blur-sm"></div>
        <div className="absolute w-96 h-96 bg-blue-600 rounded-full blur-[128px] opacity-20 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>

        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="mb-6 flex justify-center">
             {/* Logo lớn ở giữa */}
             <div className="w-24 h-24 bg-white rounded-full p-2 flex items-center justify-center shadow-2xl shadow-blue-500/50">
                 <img src="/logosot.png" alt="SOT" className="object-contain" />
             </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
            SOT VDI <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">GATEWAYS</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto">
            Hệ thống thi thực hành trực tuyến chính thức của Khoa Công nghệ. 
            Môi trường Lab ảo hóa, bảo mật cao và truy cập mọi lúc mọi nơi.
          </p>

          <div className="flex justify-center space-x-4">
            {user ? (
               // Nếu đã đăng nhập -> Nút dẫn về trang chức năng
               <Link 
                  href={user.role === 'ADMIN' ? '/admin' : '/dashboard'} 
                  className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-lg font-bold text-lg shadow-lg shadow-blue-500/40 transition hover:-translate-y-1"
               >
                  {user.role === 'ADMIN' ? 'Vào trang Quản trị' : 'Vào phòng thi'}
               </Link>
            ) : (
               // Nếu chưa đăng nhập -> Nút Đăng nhập
               <Link href="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-lg font-bold text-lg shadow-lg shadow-blue-500/40 transition hover:-translate-y-1">
                  Đăng nhập hệ thống
               </Link>
            )}
            
            <a href="#guide" className="border border-gray-600 hover:border-white hover:bg-white/5 px-8 py-4 rounded-lg font-bold text-lg transition">
                Xem hướng dẫn
            </a>
          </div>
        </div>
      </section>

      {/* ABOUT / GUIDE SECTION */}
      <section id="guide" className="bg-gray-800 py-20">
        <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold mb-10 text-center">Quy trình tham gia kỳ thi</h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="p-6 bg-gray-700/50 rounded-xl border border-gray-600">
                    <div className="text-4xl mb-4">🔐</div>
                    <h3 className="text-xl font-bold mb-2">1. Đăng nhập</h3>
                    <p className="text-gray-400">Sử dụng tài khoản MSSV được cấp để truy cập vào hệ thống SOT VDI Gateways.</p>
                </div>
                <div className="p-6 bg-gray-700/50 rounded-xl border border-gray-600">
                    <div className="text-4xl mb-4">🖥️</div>
                    <h3 className="text-xl font-bold mb-2">2. Nhận máy ảo</h3>
                    <p className="text-gray-400">Hệ thống tự động cấp phát một máy tính ảo (VDI) sạch để bạn làm bài thi.</p>
                </div>
                <div className="p-6 bg-gray-700/50 rounded-xl border border-gray-600">
                    <div className="text-4xl mb-4">✅</div>
                    <h3 className="text-xl font-bold mb-2">3. Nộp bài</h3>
                    <p className="text-gray-400">Lưu bài làm trên máy ảo và xác nhận kết thúc ca thi.</p>
                </div>
            </div>
        </div>
      </section>
    </div>
  );
}