'use client';

export default function Footer() {
  return (
    <footer className="relative z-10 w-full bg-slate-950 text-slate-400 py-10 border-t border-slate-800 font-sans text-sm leading-relaxed">
      <div className="container mx-auto px-6 lg:px-12">
        
        {/* --- GRID LAYOUT --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-16">
          
          {/* CỘT 1: LOGO & GIỚI THIỆU */}
          <div className="flex flex-col space-y-4">
            {/* Logo Group: Đã thu nhỏ kích thước (h-9 đến h-10) để cân đối */}
            <div className="flex items-center gap-4">
              {/* Logo Khoa */}
              <div className="h-10 w-auto flex-shrink-0">
                 <img 
                    src="/logosot.png" 
                    alt="School of Technology" 
                    className="h-full w-auto object-contain" 
                    onError={(e) => e.currentTarget.style.display='none'}
                 />
              </div>
              
              {/* Vạch ngăn cách mảnh */}
              <div className="h-8 w-[1px] bg-slate-700"></div>

              {/* Logo Sản phẩm */}
              <div className="h-8 w-auto flex-shrink-0">
                 <img 
                    src="/sot-vdi-trang.png" 
                    alt="SOT VDI Gateway" 
                    className="h-full w-auto object-contain" 
                    onError={(e) => e.currentTarget.style.display='none'}
                 />
              </div>
            </div>
            
            <p className="text-slate-500 text-xs text-justify max-w-sm">
              Hệ thống thực hành máy tính ảo và quản lý kỳ thi trực tuyến chất lượng cao, phục vụ nhu cầu học tập và thi cử hiện đại.
            </p>
          </div>

          {/* CỘT 2: ĐỘI NGŨ PHÁT TRIỂN */}
          <div>
            <h3 className="text-white font-bold uppercase tracking-wider mb-4 text-xs border-b border-slate-800 pb-2 inline-block">
              Đội ngũ phát triển
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-slate-200 font-bold">
                  TechGen Team
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Câu lạc bộ Lập trình ứng dụng (APC)<br/>
                  Khoa Công Nghệ
                </p>
              </div>
              
              <div className="pt-2">
                 <h4 className="text-slate-400 font-bold uppercase text-[10px] mb-1">Hỗ trợ kỹ thuật</h4>
                 <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                    <span className="text-slate-300 font-medium">Sơn Tân</span>
                    <span className="text-slate-600 mx-1">|</span>
                    <a href="tel:0818126177" className="text-slate-300 hover:text-emerald-400 transition">0818 126 177</a>
                 </div>
              </div>
            </div>
          </div>

          {/* CỘT 3: ĐỊA CHỈ LIÊN HỆ (VIẾT ĐẦY ĐỦ) */}
          <div>
            <h3 className="text-white font-bold uppercase tracking-wider mb-4 text-xs border-b border-slate-800 pb-2 inline-block">
              Địa chỉ liên hệ
            </h3>
            <div className="space-y-3 text-sm">
              <p className="font-bold text-white">
                Ban Tổ chức các Kỳ thi Olympic UMT
              </p>
              <p className="text-slate-400 text-xs">
                Khoa Công Nghệ, Phòng 508, Tòa nhà Sáng tạo, Trường Đại học Quản lý và Công nghệ Thành phố Hồ Chí Minh
              </p>
              
              <div className="flex gap-3 mt-4 items-start">
                <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="text-slate-400 text-xs leading-relaxed">
                  Số 2, Đường 60CL, Khu phố 9, Phường Cát Lái, Thành phố Hồ Chí Minh
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* --- COPYRIGHT --- */}
        <div className="border-t border-slate-800/50 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center text-xs text-slate-600">
          <p>© 2026 School of Technology VDI Gateway. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
             <a href="#" className="hover:text-emerald-400 transition">Điều khoản sử dụng</a>
             <a href="#" className="hover:text-emerald-400 transition">Chính sách bảo mật</a>
          </div>
        </div>
      </div>
    </footer>
  );
}