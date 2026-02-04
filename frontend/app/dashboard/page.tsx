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

  // --- 2. LOGIC PHÂN LOẠI KỲ THI ---
  const now = new Date();

  // A. Đang diễn ra: (Start <= Now <= End) VÀ (isActive = true)
  const ongoingExams = exams.filter(e => {
      const start = new Date(e.startTime);
      const end = new Date(e.endTime);
      return e.isActive && now >= start && now <= end;
  });

  // B. Sắp diễn ra: (Start > Now) VÀ (isActive = true)
  const upcomingExams = exams.filter(e => {
      const start = new Date(e.startTime);
      return e.isActive && start > now;
  });

  // C. Đã kết thúc: (End < Now) HOẶC (isActive = false)
  const pastExams = exams.filter(e => {
      const end = new Date(e.endTime);
      return !e.isActive || end < now;
  });

  const handleEnterExam = (examId: number) => {
    router.push(`/exam/${examId}`);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>;

  // --- COMPONENT CON ĐỂ RENDER CARD (Cho gọn code) ---
  const ExamCard = ({ exam, type }: { exam: any, type: 'ONGOING' | 'UPCOMING' | 'PAST' }) => (
    <div className={`rounded-xl shadow-sm border transition duration-200 
        ${type === 'ONGOING' ? 'bg-white border-blue-200 shadow-md ring-1 ring-blue-100 hover:shadow-xl' : ''}
        ${type === 'UPCOMING' ? 'bg-white border-gray-100 hover:shadow-md' : ''}
        ${type === 'PAST' ? 'bg-gray-50 border-gray-200 opacity-75 grayscale hover:grayscale-0' : ''}
    `}>
        {/* Header màu mè phân loại */}
        <div className={`h-1.5 rounded-t-xl w-full
            ${type === 'ONGOING' ? 'bg-gradient-to-r from-green-400 to-blue-500 animate-pulse' : ''}
            ${type === 'UPCOMING' ? 'bg-yellow-400' : ''}
            ${type === 'PAST' ? 'bg-gray-300' : ''}
        `}></div>

        <div className="p-5">
            <div className="flex justify-between items-start mb-3">
                <h3 className={`font-bold text-lg ${type === 'PAST' ? 'text-gray-600' : 'text-gray-800'}`}>
                    {exam.name}
                </h3>
                {type === 'ONGOING' && <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded font-bold animate-pulse">● Đang thi</span>}
                {type === 'UPCOMING' && <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded font-bold">Sắp tới</span>}
                {type === 'PAST' && <span className="bg-gray-200 text-gray-500 text-xs px-2 py-1 rounded font-bold">Đã đóng</span>}
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 mb-5">
                <div className="flex items-center gap-2">
                    <span className="text-gray-400">🕒 Bắt đầu:</span>
                    <span className="font-medium">
                        {new Date(exam.startTime).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-gray-400">⏳ Kết thúc:</span>
                    <span className="font-medium">
                        {new Date(exam.endTime).toLocaleString('vi-VN')}
                    </span>
                </div>
            </div>

            {/* Nút bấm chỉ hiện khi ĐANG DIỄN RA hoặc SẮP TỚI (vào sảnh chờ trước) */}
            {type !== 'PAST' ? (
                <button 
                    onClick={() => handleEnterExam(exam.id)}
                    className={`w-full font-bold py-2.5 rounded-lg transition flex items-center justify-center gap-2
                        ${type === 'ONGOING' 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 shadow-lg' 
                            : 'bg-white border border-blue-600 text-blue-600 hover:bg-blue-50'}
                    `}
                >
                    {type === 'ONGOING' ? 'VÀO THI NGAY 🚀' : 'Vào sảnh chờ →'}
                </button>
            ) : (
                <button disabled className="w-full bg-gray-200 text-gray-400 font-bold py-2.5 rounded-lg cursor-not-allowed">
                    Đã kết thúc
                </button>
            )}
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header chào hỏi (Đã xóa nút Đăng xuất vô duyên) */}
        <div>
            <h1 className="text-3xl font-bold text-gray-800">Trang chủ thi cử</h1>
            <p className="text-gray-600 mt-1">
                Chào <span className="font-bold text-blue-600">{user?.fullName}</span>, chúc bạn làm bài thật tốt! 💪
            </p>
        </div>

        {/* --- TẦNG 1: ĐANG DIỄN RA (Quan trọng nhất) --- */}
        <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                🔥 Đang diễn ra <span className="text-sm font-normal text-gray-500">({ongoingExams.length})</span>
            </h2>
            {ongoingExams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ongoingExams.map(exam => <ExamCard key={exam.id} exam={exam} type="ONGOING" />)}
                </div>
            ) : (
                <div className="bg-white p-6 rounded-lg border border-dashed border-gray-300 text-center text-gray-400">
                    Hiện không có kỳ thi nào đang diễn ra.
                </div>
            )}
        </section>

        {/* --- TẦNG 2: SẮP DIỄN RA --- */}
        <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                📅 Sắp diễn ra <span className="text-sm font-normal text-gray-500">({upcomingExams.length})</span>
            </h2>
            {upcomingExams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingExams.map(exam => <ExamCard key={exam.id} exam={exam} type="UPCOMING" />)}
                </div>
            ) : (
                <p className="text-gray-400 text-sm italic">Không có kỳ thi nào sắp tới.</p>
            )}
        </section>

        {/* --- TẦNG 3: ĐÃ KẾT THÚC --- */}
        <section className="opacity-80 hover:opacity-100 transition">
            <h2 className="text-xl font-bold text-gray-600 mb-4 flex items-center gap-2">
                🗄️ Đã kết thúc / Đóng <span className="text-sm font-normal text-gray-400">({pastExams.length})</span>
            </h2>
            {pastExams.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pastExams.map(exam => <ExamCard key={exam.id} exam={exam} type="PAST" />)}
                </div>
            ) : (
                <p className="text-gray-400 text-sm italic">Lịch sử trống.</p>
            )}
        </section>

      </div>
    </div>
  );
}