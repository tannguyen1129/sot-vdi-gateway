"use client";
import { useState } from 'react';

interface LobbyProps {
    exam: any;
    user: any;
    onJoin: (accessCode: string) => void;
    loading: boolean;
    error: string;
}

export default function ExamLobby({ exam, user, onJoin, loading, error }: LobbyProps) {
    const [code, setCode] = useState('');

    // Xử lý khi nhấn Enter
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onJoin(code);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative font-sans text-slate-800">
            
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            </div>

            {/* Main Ticket Card */}
            <div className="bg-white max-w-2xl w-full shadow-2xl border-t-4 border-blue-600 relative z-10 animate-in fade-in zoom-in duration-300">
                
                {/* --- HEADER: USER INFO --- */}
                <div className="bg-slate-50 border-b border-slate-200 p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white border border-slate-200 flex items-center justify-center text-2xl shadow-sm">
                            🎓
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thí sinh</p>
                            <h2 className="text-lg font-bold text-slate-800">{user?.fullName}</h2>
                            <p className="text-xs font-mono text-blue-600 font-bold bg-blue-50 inline-block px-1 mt-0.5 border border-blue-100">
                                {user?.username}
                            </p>
                        </div>
                    </div>
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hệ thống</p>
                        <p className="text-sm font-bold text-slate-600">SOT VDI GATEWAY</p>
                    </div>
                </div>

                <div className="p-8">
                    {/* --- EXAM TITLE --- */}
                    <div className="text-center mb-8">
                        <span className="inline-block px-3 py-1 mb-3 text-[10px] font-bold uppercase tracking-widest text-white bg-blue-600">
                            Kỳ Thi Chính Thức
                        </span>
                        <h1 className="text-3xl font-black text-slate-900 uppercase leading-tight">
                            {exam?.name}
                        </h1>
                        <p className="text-slate-500 mt-2 text-sm italic">
                            {exam?.description || "Vui lòng chuẩn bị sẵn sàng trước khi vào phòng thi."}
                        </p>
                    </div>

                    {/* --- TIME INFO GRID --- */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="border border-slate-200 p-4 bg-slate-50 text-center group hover:border-blue-300 transition-colors">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Thời gian bắt đầu</p>
                            <p className="text-xl font-mono font-bold text-slate-700">
                                {exam?.startTime ? new Date(exam.startTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                                {exam?.startTime ? new Date(exam.startTime).toLocaleDateString('vi-VN') : ''}
                            </p>
                        </div>
                        <div className="border border-slate-200 p-4 bg-slate-50 text-center group hover:border-blue-300 transition-colors">
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Thời gian kết thúc</p>
                            <p className="text-xl font-mono font-bold text-slate-700">
                                {exam?.endTime ? new Date(exam.endTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                                {exam?.endTime ? new Date(exam.endTime).toLocaleDateString('vi-VN') : ''}
                            </p>
                        </div>
                    </div>

                    {/* --- RULES LIST (Trang trí) --- */}
                    <div className="mb-8 p-4 bg-amber-50 border border-amber-200 text-sm text-amber-800">
                        <h3 className="font-bold uppercase text-xs mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            Lưu ý quan trọng:
                        </h3>
                        <ul className="list-disc list-inside space-y-1 text-xs font-medium opacity-90">
                            <li>Không tải lại trang (F5) khi đang làm bài.</li>
                            <li>Hệ thống sẽ tự động ghi lại màn hình và log thao tác.</li>
                            <li>Đảm bảo kết nối mạng ổn định trước khi nhấn nút "Vào phòng thi".</li>
                        </ul>
                    </div>

                    {/* --- ACCESS CODE INPUT --- */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                Mã Truy Cập (Access Code)
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                </div>
                                <input 
                                    type="text" // Để text cho dễ nhìn, có thể đổi thành password nếu muốn bảo mật cao
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="block w-full pl-10 pr-3 py-3 border-2 border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-blue-50/10 transition-all font-mono text-lg font-bold tracking-widest uppercase"
                                    placeholder="ENTER CODE"
                                />
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 border border-red-200">
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span className="text-sm font-bold">{error}</span>
                            </div>
                        )}

                        {/* Button */}
                        <button 
                            onClick={() => onJoin(code)}
                            disabled={loading || !code}
                            className={`w-full py-4 px-6 font-bold text-sm uppercase tracking-widest text-white transition-all duration-200 flex items-center justify-center gap-3 shadow-lg
                                ${loading || !code
                                    ? 'bg-slate-400 cursor-not-allowed shadow-none' 
                                    : 'bg-blue-700 hover:bg-blue-800 shadow-blue-900/20 active:translate-y-0.5'
                                }`
                            }
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Đang Xác Thực...
                                </>
                            ) : (
                                <>
                                    Vào Phòng Thi
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer Deco */}
                <div className="bg-slate-100 p-3 text-center border-t border-slate-200">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                        Secure Connection Established • VDI Protocol Ready
                    </p>
                </div>
            </div>
        </div>
    );
}