"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from './../../utils/axios';

// Import 2 component con đã tách
import ExamLobby from './components/ExamLobby';
import ExamMachine from './components/ExamMachine';

export default function ExamPage() {
  const { id } = useParams();
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [exam, setExam] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isReady, setIsReady] = useState(false); // Trạng thái sẵn sàng render UI

  // 1. Check User & Load Info
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        router.push('/login');
        return;
    }
    setUser(JSON.parse(userStr));

    const fetchExam = async () => {
        try {
            const res = await api.get(`/exams/${id}`);
            setExam(res.data);
            setIsReady(true);
        } catch (err) {
            alert("Không tìm thấy kỳ thi!");
            router.push('/dashboard');
        }
    };
    fetchExam();
  }, [id, router]);

  // 2. Xử lý Join (Từ Lobby)
  const handleJoin = async (accessCode: string) => {
    setLoading(true);
    setErrorMsg('');
    try {
        const res = await api.post(`/exams/${id}/join`, {
            userId: user.id,
            accessCode: accessCode
        });

        if (res.data.connectionToken) {
            // Khi có Token -> Chuyển state sang hiển thị máy ảo
            setToken(res.data.connectionToken);
            // Yêu cầu Fullscreen
            try {
                await document.documentElement.requestFullscreen();
            } catch (e) { console.log("Fullscreen denied"); }
        }
    } catch (err: any) {
        setErrorMsg(err.response?.data?.message || "Lỗi kết nối máy chủ thi.");
    } finally {
        setLoading(false);
    }
  };

  // 3. Xử lý Exit (Từ Machine)
  const handleExit = async () => {
      if (!confirm("Bạn có chắc chắn muốn thoát? Máy ảo sẽ bị tắt.")) return;
      try {
          await api.post('/exams/leave', { userId: user.id });
          if (document.fullscreenElement) document.exitFullscreen();
          router.push('/dashboard');
      } catch (err) { console.error(err); }
  };

  if (!isReady) return <div className="h-screen bg-gray-50 flex items-center justify-center">Đang tải dữ liệu...</div>;

  // --- LOGIC ĐIỀU HƯỚNG HIỂN THỊ ---
  // Nếu có Token -> Render Máy ảo
  if (token) {
      return (
          <ExamMachine 
              examName={exam.name} 
              token={token} 
              onExit={handleExit} 
          />
      );
  }

  // Nếu chưa có Token -> Render Sảnh chờ
  return (
      <ExamLobby 
          exam={exam} 
          user={user} 
          onJoin={handleJoin} 
          loading={loading} 
          error={errorMsg} 
      />
  );
}