"use client";

import { useEffect, useState } from "react";
import api from "./../../utils/axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Exam {
  id: number;
  name: string; // Đã sửa từ 'title' thành 'name' cho khớp với backend
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export default function MonitorHubPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'ENDED'>('ALL');
  const router = useRouter();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const res = await api.get("/exams");
      // Sắp xếp: Đang diễn ra lên đầu, sau đó đến Sắp tới, cuối cùng là Đã qua
      const sorted = res.data.sort((a: Exam, b: Exam) => {
         const now = new Date().getTime();
         const aActive = a.isActive && now >= new Date(a.startTime).getTime() && now <= new Date(a.endTime).getTime();
         const bActive = b.isActive && now >= new Date(b.startTime).getTime() && now <= new Date(b.endTime).getTime();
         if (aActive && !bActive) return -1;
         if (!aActive && bActive) return 1;
         return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
      });
      setExams(sorted);
    } catch (error) {
      console.error("Lỗi tải danh sách kỳ thi:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper trạng thái
  const getExamStatus = (exam: Exam) => {
    const now = new Date().getTime();
    const start = new Date(exam.startTime).getTime();
    const end = new Date(exam.endTime).getTime();

    if (!exam.isActive) return { type: 'DISABLED', label: "ĐÃ VÔ HIỆU", color: "bg-slate-100 text-slate-400 border-slate-300" };
    if (now < start) return { type: 'UPCOMING', label: "SẮP DIỄN RA", color: "bg-amber-50 text-amber-600 border-amber-200" };
    if (now >= start && now <= end) return { type: 'LIVE', label: "LIVE - ĐANG THI", color: "bg-emerald-50 text-emerald-600 border-emerald-500 shadow-emerald-100" };
    return { type: 'ENDED', label: "ĐÃ KẾT THÚC", color: "bg-slate-50 text-slate-500 border-slate-200" };
  };

  // Filter Logic
  const filteredExams = exams.filter(exam => {
      const status = getExamStatus(exam);
      if (filter === 'ACTIVE') return status.type === 'LIVE';
      if (filter === 'ENDED') return status.type === 'ENDED' || status.type === 'DISABLED';
      return true;
  });

  if (loading) {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Admin Control Panel</span>
            </div>
            <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tight">
              Monitor Hub
            </h1>
            <p className="text-slate-500 mt-2 font-medium max-w-xl">
              Trung tâm giám sát thời gian thực. Chọn kỳ thi để truy cập vào bảng điều khiển chi tiết (Live View & Logs).
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="bg-white p-1 rounded-lg border border-slate-200 shadow-sm flex">
                <button onClick={() => setFilter('ALL')} className={`px-4 py-2 rounded-md text-xs font-bold uppercase transition-all ${filter === 'ALL' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>Tất cả</button>
                <button onClick={() => setFilter('ACTIVE')} className={`px-4 py-2 rounded-md text-xs font-bold uppercase transition-all ${filter === 'ACTIVE' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>Đang Live</button>
                <button onClick={() => setFilter('ENDED')} className={`px-4 py-2 rounded-md text-xs font-bold uppercase transition-all ${filter === 'ENDED' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}>Lịch sử</button>
             </div>
             <button 
               onClick={fetchExams}
               className="p-3 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm"
               title="Làm mới"
             >
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
             </button>
          </div>
        </div>

        {/* --- GRID LIST --- */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredExams.map((exam) => {
            const status = getExamStatus(exam);
            const isLive = status.type === 'LIVE';

            return (
              <div 
                key={exam.id} 
                className={`group relative bg-white rounded-xl border-2 transition-all duration-300 overflow-hidden flex flex-col
                   ${isLive 
                      ? 'border-emerald-500 shadow-xl shadow-emerald-500/10 -translate-y-1' 
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-lg'
                   }
                `}
              >
                {/* Live Indicator Strip */}
                {isLive && <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 animate-pulse"></div>}

                <div className="p-6 flex-1">
                  {/* Status Badge */}
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${status.color}`}>
                      {status.type === 'LIVE' && <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-ping"></span>}
                      {status.label}
                    </span>
                    <span className="text-xs font-mono text-slate-300">#{exam.id.toString().padStart(3, '0')}</span>
                  </div>
                  
                  {/* Title */}
                  <h3 className={`text-xl font-bold mb-4 line-clamp-2 ${isLive ? 'text-slate-900' : 'text-slate-600'}`}>
                    {exam.name}
                  </h3>
                  
                  {/* Time Info */}
                  <div className="space-y-3 py-4 border-t border-slate-100">
                    <div className="flex items-center gap-3 text-sm">
                       <div className={`w-8 h-8 rounded flex items-center justify-center ${isLive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       </div>
                       <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Bắt đầu</div>
                          <div className="font-mono text-slate-700 text-xs font-bold">
                             {new Date(exam.startTime).toLocaleString('vi-VN')}
                          </div>
                       </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                       <div className={`w-8 h-8 rounded flex items-center justify-center ${isLive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M3 21v-8a2 2 0 012-2h14a2 2 0 012 2v8M5 21h14M5 21v-8a2 2 0 012-2h14a2 2 0 012 2v8" /></svg>
                       </div>
                       <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Kết thúc</div>
                          <div className="font-mono text-slate-700 text-xs font-bold">
                             {new Date(exam.endTime).toLocaleString('vi-VN')}
                          </div>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-slate-50 border-t border-slate-100">
                  <Link 
                    href={`/admin/monitor/${exam.id}`}
                    className={`block w-full py-3 px-4 rounded-lg font-bold text-sm uppercase tracking-wider text-center transition-all duration-200 transform active:scale-95 border-b-4 active:border-b-0 active:translate-y-1
                      ${isLive 
                        ? 'bg-emerald-600 text-white border-emerald-800 hover:bg-emerald-500 hover:border-emerald-700 shadow-lg shadow-emerald-200' 
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100 hover:text-blue-600 hover:border-blue-300'
                      }
                    `}
                  >
                    {isLive ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            Truy Cập Live Monitor
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Xem Nhật Ký (Logs)
                        </span>
                    )}
                  </Link>
                </div>
              </div>
            );
          })}

          {filteredExams.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="inline-block p-6 rounded-full bg-slate-100 mb-4">
                  <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800">Không tìm thấy dữ liệu</h3>
              <p className="text-slate-500 mt-2">Chưa có kỳ thi nào khớp với bộ lọc hiện tại.</p>
              {filter !== 'ALL' && (
                  <button onClick={() => setFilter('ALL')} className="mt-4 text-blue-600 font-bold hover:underline">Xóa bộ lọc</button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}