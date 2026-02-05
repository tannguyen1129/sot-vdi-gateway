"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from './../utils/axios';

export default function Dashboard() {
  const router = useRouter();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // --- 1. LẤY DỮ LIỆU ---
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        router.push('/login');
        return;
    }
    setUser(JSON.parse(userStr));

    const fetchExams = async () => {
      try {
        const res = await api.get('/exams'); 
        setExams(res.data);
      } catch (err) {
        console.error("Lỗi tải danh sách thi:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, [router]);

  // --- 2. LOGIC PHÂN LOẠI ---
  const now = new Date();

  // A. Đang diễn ra
  const ongoingExams = exams.filter(e => {
      const start = new Date(e.startTime);
      const end = new Date(e.endTime);
      return e.isActive && now >= start && now <= end;
  });

  // B. Sắp diễn ra
  const upcomingExams = exams.filter(e => {
      const start = new Date(e.startTime);
      return e.isActive && start > now;
  });

  // C. Đã kết thúc
  const pastExams = exams.filter(e => {
      const end = new Date(e.endTime);
      return !e.isActive || end < now;
  });

  const handleEnterExam = (examId: number) => {
    router.push(`/exam/${examId}`);
  };

  // --- COMPONENT CARD HIỆN ĐẠI (Vuông vức) ---
  const ExamCard = ({ exam, type }: { exam: any, type: 'ONGOING' | 'UPCOMING' | 'PAST' }) => {
    // Cấu hình màu sắc dựa trên Type
    const statusConfig = {
        ONGOING: {
            border: 'border-blue-600',
            bgHover: 'hover:border-blue-600 hover:shadow-lg hover:shadow-blue-900/5',
            badgeBg: 'bg-blue-600',
            badgeText: 'text-white',
            label: 'ĐANG DIỄN RA',
            btnStyle: 'bg-blue-600 text-white hover:bg-blue-700'
        },
        UPCOMING: {
            border: 'border-amber-500',
            bgHover: 'hover:border-amber-500 hover:shadow-lg hover:shadow-amber-900/5',
            badgeBg: 'bg-amber-100',
            badgeText: 'text-amber-700',
            label: 'SẮP BẮT ĐẦU',
            btnStyle: 'bg-white border border-slate-300 text-slate-600 hover:border-amber-500 hover:text-amber-600'
        },
        PAST: {
            border: 'border-slate-300',
            bgHover: 'opacity-75',
            badgeBg: 'bg-slate-100',
            badgeText: 'text-slate-500',
            label: 'ĐÃ KẾT THÚC',
            btnStyle: 'bg-slate-100 text-slate-400 cursor-not-allowed'
        }
    };

    const config = statusConfig[type];

    return (
        <div className={`group relative bg-white border border-slate-200 border-l-4 p-6 transition-all duration-300 ${config.border} ${config.bgHover}`}>
            
            {/* Header: Badge & Title */}
            <div className="flex justify-between items-start mb-4">
                <div>
                    <span className={`inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wider mb-2 ${config.badgeBg} ${config.badgeText}`}>
                        {config.label}
                    </span>
                    <h3 className={`text-lg font-bold leading-tight ${type === 'PAST' ? 'text-slate-500' : 'text-slate-900'}`}>
                        {exam.name}
                    </h3>
                </div>
            </div>

            {/* Time Info */}
            <div className="space-y-3 mb-6 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold">Bắt đầu</p>
                        <p className="font-mono font-medium text-slate-700">
                            {new Date(exam.startTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 uppercase font-semibold">Kết thúc</p>
                        <p className="font-mono font-medium text-slate-700">
                            {new Date(exam.endTime).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </p>
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <button 
                onClick={() => type !== 'PAST' && handleEnterExam(exam.id)}
                disabled={type === 'PAST'}
                className={`w-full py-3 px-4 font-bold text-sm uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 ${config.btnStyle}`}
            >
                {type === 'ONGOING' && (
                    <>
                        VÀO THI NGAY
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                    </>
                )}
                {type === 'UPCOMING' && 'VÀO SẢNH CHỜ'}
                {type === 'PAST' && 'ĐÃ ĐÓNG'}
            </button>
        </div>
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 relative font-sans text-slate-800">
       
       {/* Background Grid Pattern (Giống Landing Page) */}
       <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
       </div>

      <div className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        
        {/* HEADER SECTION */}
        <div className="mb-12 border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Cổng thi trực tuyến</h1>
                <p className="text-slate-500 mt-2 text-sm font-medium">
                    Xin chào, <span className="text-blue-600 font-bold">{user?.fullName || 'Sinh viên'}</span>. Chúc bạn hoàn thành bài thi thật tốt.
                </p>
            </div>
            <div className="text-right hidden md:block">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thời gian hệ thống</div>
                <div className="text-xl font-mono font-bold text-slate-700">
                    {now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </div>

        {/* --- TẦNG 1: ĐANG DIỄN RA (Priority) --- */}
        <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
                <div className="h-6 w-1 bg-blue-600"></div>
                <h2 className="text-xl font-bold text-slate-900 uppercase tracking-wide">
                    Đang diễn ra <span className="ml-2 text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-none font-bold">{ongoingExams.length}</span>
                </h2>
            </div>
            
            {ongoingExams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ongoingExams.map(exam => <ExamCard key={exam.id} exam={exam} type="ONGOING" />)}
                </div>
            ) : (
                <div className="bg-white border border-dashed border-slate-300 p-8 text-center">
                    <p className="text-slate-400 font-medium text-sm">Hiện không có kỳ thi nào đang diễn ra.</p>
                </div>
            )}
        </section>

        {/* --- TẦNG 2: SẮP DIỄN RA --- */}
        <section className="mb-12">
             <div className="flex items-center gap-3 mb-6">
                <div className="h-6 w-1 bg-amber-500"></div>
                <h2 className="text-xl font-bold text-slate-900 uppercase tracking-wide">
                    Sắp diễn ra <span className="ml-2 text-sm bg-amber-50 text-amber-700 px-2 py-0.5 rounded-none font-bold">{upcomingExams.length}</span>
                </h2>
            </div>
            {upcomingExams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingExams.map(exam => <ExamCard key={exam.id} exam={exam} type="UPCOMING" />)}
                </div>
            ) : (
                <p className="text-slate-400 text-sm italic pl-4">Không có kỳ thi nào sắp tới.</p>
            )}
        </section>

        {/* --- TẦNG 3: LỊCH SỬ --- */}
        <section className="opacity-75 hover:opacity-100 transition-opacity duration-300">
             <div className="flex items-center gap-3 mb-6">
                <div className="h-6 w-1 bg-slate-400"></div>
                <h2 className="text-xl font-bold text-slate-600 uppercase tracking-wide">
                    Lịch sử thi <span className="ml-2 text-sm bg-slate-100 text-slate-500 px-2 py-0.5 rounded-none font-bold">{pastExams.length}</span>
                </h2>
            </div>
            {pastExams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pastExams.map(exam => <ExamCard key={exam.id} exam={exam} type="PAST" />)}
                </div>
            ) : (
                <p className="text-slate-400 text-sm italic pl-4">Chưa có lịch sử thi.</p>
            )}
        </section>

      </div>
    </div>
  );
}