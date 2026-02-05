"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function StudentGuidePage() {
  const [activeSection, setActiveSection] = useState('intro');

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* --- HERO HEADER --- */}
      <div className="bg-[#0f1117] text-white py-12 px-6 border-b border-slate-800">
        <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-4 text-emerald-400 font-bold text-sm uppercase tracking-widest">
                <span className="bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded">Hệ thống thi VDI</span>
                <span>•</span>
                <span>Tài liệu hướng dẫn</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Hướng Dẫn Dành Cho Thí Sinh</h1>
            <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
                Quy chuẩn, thao tác sử dụng và các lưu ý quan trọng để tránh vi phạm quy chế thi trên hệ thống máy ảo trực tuyến.
            </p>
            <div className="mt-8 flex gap-4">
                <Link href="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold transition-all shadow-lg hover:shadow-blue-500/25 flex items-center gap-2">
                    Vào trang Đăng nhập
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </Link>
            </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-10">
        
        {/* --- SIDEBAR NAVIGATION (STICKY) --- */}
        <aside className="md:w-64 flex-shrink-0">
            <div className="sticky top-6 space-y-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-3">Nội dung</p>
                {[
                    { id: 'intro', label: '1. Giới thiệu chung' },
                    { id: 'prep', label: '2. Chuẩn bị trước thi' },
                    { id: 'login', label: '3. Đăng nhập & Vào thi' },
                    { id: 'interface', label: '4. Giao diện làm bài' },
                    { id: 'mouse', label: '5. Cơ chế Chuột & Phím' },
                    { id: 'anticheat', label: '6. Quy định & Chống gian lận' },
                    { id: 'submit', label: '7. Nộp bài thi' },
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={() => scrollToSection(item.id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            activeSection === item.id 
                            ? 'bg-blue-50 text-blue-700 border-l-2 border-blue-600' 
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <div className="flex-1 space-y-16">
            
            {/* 1. Giới thiệu */}
            <section id="intro" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm">01</span>
                    Giới thiệu chung
                </h2>
                <div className="prose text-slate-600 leading-relaxed">
                    <p>
                        Hệ thống thi VDI (Virtual Desktop Infrastructure) cung cấp cho mỗi thí sinh một 
                        <strong> máy tính ảo riêng biệt</strong> ngay trên trình duyệt web. 
                        Mọi thao tác làm bài thi (Code, Word, Excel...) đều thực hiện trên máy ảo này, 
                        không phụ thuộc vào cấu hình máy cá nhân của bạn.
                    </p>
                </div>
            </section>

            {/* 2. Chuẩn bị */}
            <section id="prep" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm">02</span>
                    Chuẩn bị trước giờ G
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            Trình duyệt khuyến nghị
                        </h3>
                        <p className="text-sm text-slate-500">Sử dụng phiên bản mới nhất của <strong>Google Chrome</strong>, <strong>Microsoft Edge</strong> hoặc <strong>Firefox</strong>. Không dùng Safari hoặc IE.</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>
                            Mạng ổn định
                        </h3>
                        <p className="text-sm text-slate-500">Kết nối yêu cầu tối thiểu <strong>5Mbps</strong>. Ưu tiên dùng mạng dây (LAN) hoặc Wifi ổn định để tránh giật lag khi điều khiển máy ảo.</p>
                    </div>
                </div>
            </section>

            {/* 3. Đăng nhập & Vào thi */}
            <section id="login" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm">03</span>
                    Đăng nhập & Vào thi
                </h2>
                <ol className="list-decimal list-inside space-y-3 text-slate-700 bg-white p-6 rounded-xl border border-slate-200">
                    <li>Truy cập vào trang chủ hệ thống.</li>
                    <li>Đăng nhập bằng tài khoản (MSSV) và mật khẩu được cấp.</li>
                    <li>Tại màn hình <strong>Dashboard</strong>, tìm kỳ thi đang diễn ra.</li>
                    <li>Nhập <strong>Mã truy cập (Access Code)</strong> do giám thị cung cấp (nếu có).</li>
                    <li>Nhấn nút <span className="inline-block px-2 py-0.5 bg-blue-600 text-white text-xs rounded font-bold">VÀO THI</span>.</li>
                </ol>
            </section>

            {/* 4. Giao diện (Quan trọng) */}
            <section id="interface" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                    <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm">04</span>
                    Giao diện & Chế độ thi
                </h2>
                
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6">
                    <div className="flex gap-3">
                        <svg className="w-6 h-6 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        <div>
                            <h4 className="font-bold text-amber-800">Chế độ tập trung tuyệt đối</h4>
                            <p className="text-amber-700 text-sm mt-1">
                                Khi bắt đầu làm bài, trình duyệt sẽ chuyển sang chế độ <strong>Toàn màn hình (Fullscreen)</strong> và <strong>Khóa chuột (Pointer Lock)</strong>.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 shrink-0">A</div>
                        <div>
                            <h4 className="font-bold text-slate-800">Thanh thông tin (Header)</h4>
                            <p className="text-slate-600 text-sm">Nằm ở trên cùng, hiển thị Tên thí sinh, IP Máy thi và <strong>Đồng hồ đếm ngược</strong>.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600 shrink-0">B</div>
                        <div>
                            <h4 className="font-bold text-slate-800">Màn hình máy ảo</h4>
                            <p className="text-slate-600 text-sm">Khu vực chính để làm bài. Bạn thao tác chuột và bàn phím y hệt như đang ngồi trước máy tính thật.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 5. Chuột & Phím */}
            <section id="mouse" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                    <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm">05</span>
                    Cơ chế Chuột & Phím tắt
                </h2>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-[#1e293b] text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9v8l10-12h-9l9-8z"/></svg></div>
                        <h3 className="text-xl font-bold text-emerald-400 mb-2">Tổ hợp phím Vàng</h3>
                        <div className="text-3xl font-mono font-black mb-4 bg-slate-800 inline-block px-4 py-2 rounded border border-slate-600">
                            Alt + Enter
                        </div>
                        <p className="text-slate-300 text-sm leading-relaxed">
                            Dùng để <strong>MỞ KHÓA CHUỘT</strong> và hiện Menu Tạm dừng.
                            <br/><br/>
                            Hãy bấm tổ hợp này khi bạn muốn:
                            <ul className="list-disc list-inside mt-2 text-slate-400">
                                <li>Nộp bài thi.</li>
                                <li>Tạm nghỉ giải lao.</li>
                                <li>Thoát chuột ra ngoài để chỉnh âm lượng/độ sáng...</li>
                            </ul>
                        </p>
                    </div>

                    <div className="border border-slate-200 p-6 rounded-xl bg-white">
                        <h3 className="font-bold text-slate-800 mb-3">Lưu ý về chuột</h3>
                        <ul className="space-y-3 text-sm text-slate-600">
                            <li className="flex gap-2">
                                <span className="text-red-500">✕</span>
                                Không bấm phím <code>ESC</code> để thoát chuột (sẽ bị tính là vi phạm).
                            </li>
                            <li className="flex gap-2">
                                <span className="text-green-500">✓</span>
                                Nếu lỡ mất chuột hoặc click ra ngoài, hãy click lại vào vùng giữa màn hình máy ảo để tiếp tục điều khiển.
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* 6. Chống gian lận */}
            <section id="anticheat" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-red-600 mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 bg-red-600 text-white rounded-lg flex items-center justify-center text-sm">06</span>
                    Quy định Chống Gian Lận (Quan trọng)
                </h2>
                <p className="mb-4 text-slate-600">Hệ thống tự động giám sát và ghi lại log vi phạm. Tài khoản của bạn có thể bị khóa hoặc hủy kết quả nếu vi phạm các lỗi sau:</p>
                
                <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-red-100 text-red-800 font-bold uppercase">
                            <tr>
                                <th className="p-4">Hành động cấm</th>
                                <th className="p-4">Hậu quả</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-red-100 text-slate-700">
                            <tr>
                                <td className="p-4 font-medium">Thoát chế độ Toàn màn hình (Esc, F11)</td>
                                <td className="p-4 text-red-600 font-bold">Cảnh báo Vi phạm & Ghi Log</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-medium">Chuyển Tab hoặc mở ứng dụng khác (Alt + Tab)</td>
                                <td className="p-4 text-red-600 font-bold">Cảnh báo Vi phạm & Ghi Log</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-medium">Bấm phím Windows / Menu Context</td>
                                <td className="p-4 text-red-600 font-bold">Chặn phím & Cảnh báo</td>
                            </tr>
                            <tr>
                                <td className="p-4 font-medium">Di chuyển chuột ra khỏi vùng thi</td>
                                <td className="p-4 text-red-600 font-bold">Cảnh báo Vi phạm</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 p-4 bg-slate-100 rounded-lg text-sm text-slate-600 italic">
                    * Khi bị cảnh báo vi phạm, màn hình sẽ bị làm mờ. Bạn bắt buộc phải bấm nút <strong>"ĐÃ HIỂU VÀ QUAY LẠI THI"</strong> để tiếp tục. Mọi thời gian gián đoạn sẽ không được bù giờ.
                </div>
            </section>

            {/* 7. Nộp bài */}
            <section id="submit" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center text-sm">07</span>
                    Nộp bài thi
                </h2>
                <div className="flex flex-col gap-4">
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-start gap-4">
                        <div className="bg-slate-100 p-2 rounded text-slate-500 font-bold text-xl">1</div>
                        <div>
                            <h4 className="font-bold text-slate-800">Lưu bài làm</h4>
                            <p className="text-sm text-slate-600">Đảm bảo bạn đã lưu (Save) tất cả file bài làm trên máy ảo vào đúng thư mục yêu cầu của đề thi.</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-start gap-4">
                        <div className="bg-slate-100 p-2 rounded text-slate-500 font-bold text-xl">2</div>
                        <div>
                            <h4 className="font-bold text-slate-800">Mở Menu Tùy chọn</h4>
                            <p className="text-sm text-slate-600">Nhấn tổ hợp phím <kbd className="bg-slate-200 px-1 rounded border border-slate-300">Alt</kbd> + <kbd className="bg-slate-200 px-1 rounded border border-slate-300">Enter</kbd> để hiện con trỏ chuột và menu.</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-start gap-4">
                        <div className="bg-slate-100 p-2 rounded text-slate-500 font-bold text-xl">3</div>
                        <div>
                            <h4 className="font-bold text-slate-800">Xác nhận Nộp</h4>
                            <p className="text-sm text-slate-600">Bấm nút <strong>"NỘP BÀI & KẾT THÚC"</strong>. Xác nhận lại một lần nữa ở bảng thông báo. Hệ thống sẽ tự động thu hồi máy và đưa bạn về trang chủ.</p>
                        </div>
                    </div>
                </div>
            </section>

            <div className="h-20"></div> {/* Spacer */}
        </div>
      </div>
    </div>
  );
}