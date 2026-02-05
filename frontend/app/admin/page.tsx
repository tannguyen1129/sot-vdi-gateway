"use client";
import Link from 'next/link';

export default function AdminDashboard() {
  
  // Component Card con để code gọn gàng, dễ quản lý
  const DashboardCard = ({ title, subtitle, icon, colorClass, href, description }: any) => (
    <Link href={href} className="group relative block h-full">
      <div className={`h-full bg-white border border-slate-200 border-l-4 p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${colorClass}`}>
        
        {/* Header: Icon & Title */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col">
             <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{subtitle}</span>
             <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight group-hover:text-blue-700 transition-colors">
               {title}
             </h3>
          </div>
          <div className={`w-12 h-12 flex items-center justify-center bg-slate-50 border border-slate-100 group-hover:scale-110 transition-transform duration-300`}>
             {icon}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-500 mb-8 leading-relaxed font-medium">
          {description}
        </p>

        {/* Footer: Action Arrow */}
        <div className="flex items-center text-sm font-bold uppercase tracking-wider">
           <span className="group-hover:underline decoration-2 underline-offset-4">Truy cập</span>
           <svg className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
           </svg>
        </div>

        {/* Decoration Background Icon (Mờ) */}
        <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity pointer-events-none">
            <div className="transform scale-[2.5] grayscale">
                {icon}
            </div>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-slate-50 relative font-sans">
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        
        {/* PAGE HEADER */}
        <div className="mb-12 border-b border-slate-200 pb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-2">
                        Quản trị hệ thống
                    </h1>
                    <p className="text-slate-500 font-medium max-w-2xl">
                        Trung tâm điều khiển SOT VDI Gateways. Quản lý tài nguyên, người dùng và giám sát các kỳ thi theo thời gian thực.
                    </p>
                </div>
                {/* Stats nhỏ (giả lập) để nhìn chuyên nghiệp hơn */}
                <div className="flex gap-6 text-right">
                    <div className="hidden md:block">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Server Status</div>
                        <div className="text-green-600 font-bold flex items-center justify-end gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            ONLINE
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* 1. QUẢN LÝ KỲ THI (Thêm vào cho đủ bộ Admin) */}
            <DashboardCard 
                title="Kỳ thi"
                subtitle="Tổ chức & Lên lịch"
                href="/admin/exams"
                colorClass="border-amber-500 hover:border-amber-600"
                description="Tạo kỳ thi mới, thiết lập ca thi, gán danh sách sinh viên và quản lý thời gian làm bài."
                icon={
                    <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                }
            />

            {/* 2. QUẢN LÝ SINH VIÊN */}
            <DashboardCard 
                title="Sinh viên"
                subtitle="Dữ liệu người dùng"
                href="/admin/students"
                colorClass="border-blue-600 hover:border-blue-700"
                description="Quản lý hồ sơ sinh viên, import danh sách từ Excel, cấp lại mật khẩu và phân quyền."
                icon={
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                }
            />

            {/* 3. MÁY ẢO (VDI) */}
            <DashboardCard 
                title="Hạ tầng VDI"
                subtitle="Cấu hình & Tài nguyên"
                href="/admin/vms"
                colorClass="border-indigo-600 hover:border-indigo-700"
                description="Giám sát pool máy ảo, kiểm tra trạng thái kết nối, cấu hình Template và IP Pool."
                icon={
                    <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                }
            />

            {/* 4. GIÁM SÁT THI (MONITOR) */}
            <DashboardCard 
                title="Giám sát Live"
                subtitle="Theo dõi thời gian thực"
                href="/admin/monitor"
                colorClass="border-rose-600 hover:border-rose-700"
                description="Xem màn hình trực tiếp của thí sinh, phát hiện gian lận và hỗ trợ kỹ thuật tức thời."
                icon={
                    <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                }
            />

        </div>

        {/* SECTION PHỤ: Quick Stats (Để trông pro hơn) */}
        <div className="mt-12 pt-8 border-t border-slate-200">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Trạng thái hệ thống</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-white border border-slate-200">
                    <div className="text-2xl font-black text-slate-800">--</div>
                    <div className="text-xs text-slate-500 font-medium uppercase mt-1">Sinh viên online</div>
                </div>
                <div className="p-4 bg-white border border-slate-200">
                    <div className="text-2xl font-black text-slate-800">--</div>
                    <div className="text-xs text-slate-500 font-medium uppercase mt-1">Máy ảo khả dụng</div>
                </div>
                <div className="p-4 bg-white border border-slate-200">
                    <div className="text-2xl font-black text-slate-800">--%</div>
                    <div className="text-xs text-slate-500 font-medium uppercase mt-1">Tải CPU Server</div>
                </div>
                <div className="p-4 bg-white border border-slate-200">
                    <div className="text-2xl font-black text-slate-800">--ms</div>
                    <div className="text-xs text-slate-500 font-medium uppercase mt-1">Độ trễ trung bình</div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}