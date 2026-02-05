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
    <div className="min-h-screen bg-white text-slate-800 font-sans flex flex-col">
      
      {/* ================= HERO SECTION ================= */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        
        {/* BACKGROUND: TECHNICAL GRID PATTERN */}
        <div className="absolute inset-0 z-0">
            {/* Lớp nền xám rất nhạt */}
            <div className="absolute inset-0 bg-slate-50"></div>
            {/* Họa tiết lưới (Grid) */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            
            {/* BADGE NHỎ */}
            <div className="inline-flex items-center gap-2 border border-blue-200 bg-blue-50 px-3 py-1 mb-8">
                <span className="w-2 h-2 bg-blue-600"></span>
                <span className="text-xs font-bold text-blue-800 uppercase tracking-widest">Hệ thống thi trực tuyến</span>
            </div>

            {/* TIÊU ĐỀ CHÍNH */}
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 leading-tight mb-6 tracking-tight">
              SOT VDI <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-cyan-500">GATEWAYS</span>
            </h1>
            
            {/* MÔ TẢ */}
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Nền tảng ảo hóa máy tính phòng thi tiêu chuẩn của Khoa Công Nghệ. 
              Môi trường thi cử bảo mật, công bằng và hiệu năng cao.
            </p>

            {/* BUTTONS GROUP */}
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {user ? (
                 <Link 
                   href={user.role === 'ADMIN' ? '/admin' : '/dashboard'} 
                   className="group relative px-8 py-4 bg-blue-700 text-white font-bold text-sm uppercase tracking-wider overflow-hidden hover:bg-blue-800 transition-all border border-transparent shadow-lg shadow-blue-900/20"
                 >
                   <span className="relative z-10 flex items-center gap-2">
                      {user.role === 'ADMIN' ? 'TRANG QUẢN TRỊ' : 'VÀO PHÒNG THI'}
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                   </span>
                 </Link>
              ) : (
                 <Link 
                   href="/login" 
                   className="group relative px-8 py-4 bg-blue-700 text-white font-bold text-sm uppercase tracking-wider overflow-hidden hover:bg-blue-800 transition-all border border-transparent shadow-lg shadow-blue-900/20"
                 >
                   <span className="relative z-10 flex items-center gap-2">
                      ĐĂNG NHẬP HỆ THỐNG
                      <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                   </span>
                 </Link>
              )}
              
              <a 
                href="#guide" 
                className="px-8 py-4 bg-white text-slate-700 font-bold text-sm uppercase tracking-wider border border-slate-300 hover:border-blue-600 hover:text-blue-600 transition-all"
              >
                Quy trình & Hướng dẫn
              </a>
            </div>
          </div>
        </div>

        {/* LINE SEPARATOR */}
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
      </section>

      {/* ================= FEATURES / GUIDE SECTION ================= */}
      <section id="guide" className="py-24 bg-white relative">
        <div className="container mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-4">Quy trình tham gia</h2>
                <div className="w-20 h-1 bg-blue-600 mx-auto"></div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* STEP 1 */}
                <div className="group p-8 border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-600 transition-all duration-300 relative hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 bg-slate-200 text-slate-500 text-xs font-bold px-3 py-1 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        BƯỚC 01
                    </div>
                    <div className="w-14 h-14 bg-white border border-slate-200 flex items-center justify-center mb-6 group-hover:border-blue-600 transition-colors">
                        <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-700">Đăng nhập tài khoản</h3>
                    <p className="text-slate-600 leading-relaxed text-sm">
                        Sinh viên sử dụng tài khoản <span className="font-semibold text-slate-900">MSSV</span> được nhà trường cung cấp để xác thực danh tính trước khi vào phòng thi.
                    </p>
                </div>

                {/* STEP 2 */}
                <div className="group p-8 border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-600 transition-all duration-300 relative hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1">
                     <div className="absolute top-0 right-0 bg-slate-200 text-slate-500 text-xs font-bold px-3 py-1 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        BƯỚC 02
                    </div>
                    <div className="w-14 h-14 bg-white border border-slate-200 flex items-center justify-center mb-6 group-hover:border-blue-600 transition-colors">
                        <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-700">Nhận máy ảo (VDI)</h3>
                    <p className="text-slate-600 leading-relaxed text-sm">
                        Hệ thống tự động khởi tạo và cấp phát một máy ảo sạch (Clean Environment). Đảm bảo tính công bằng và bảo mật tuyệt đối.
                    </p>
                </div>

                {/* STEP 3 */}
                <div className="group p-8 border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-600 transition-all duration-300 relative hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1">
                     <div className="absolute top-0 right-0 bg-slate-200 text-slate-500 text-xs font-bold px-3 py-1 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        BƯỚC 03
                    </div>
                    <div className="w-14 h-14 bg-white border border-slate-200 flex items-center justify-center mb-6 group-hover:border-blue-600 transition-colors">
                        <svg className="w-7 h-7 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-700">Nộp bài & Kết thúc</h3>
                    <p className="text-slate-600 leading-relaxed text-sm">
                        Lưu bài làm trên ổ đĩa được chỉ định. Nhấn nút nộp bài để xác nhận hoàn thành ca thi và đăng xuất khỏi hệ thống.
                    </p>
                </div>
            </div>
        </div>
      </section>

      {/* ĐÃ XÓA PHẦN STATS BỊ DÍNH FOOOTER */}
      
    </div>
  );
}