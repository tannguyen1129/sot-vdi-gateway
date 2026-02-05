import React, { useEffect, useState, useRef } from 'react';
import GuacamoleDisplay from './GuacamoleDisplay'; // Component VDI cũ của bạn
import { useRouter } from 'next/navigation';

interface StudentInfo {
  name: string;
  username: string;
  ip: string;
  timeLeft: number; // Giây
}

export default function ExamInterface({ studentInfo }: { studentInfo: StudentInfo }) {
  const [timeLeft, setTimeLeft] = useState(studentInfo.timeLeft);
  const [isLocked, setIsLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true); // Giả định ban đầu
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  
  const vmContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 1. LOGIC ĐẾM NGƯỢC THỜI GIAN
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          handleSubmitExam(); // Hết giờ -> Tự nộp
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. LOGIC KHÓA CHUỘT & PHÍM TẮT (Alt + Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Chặn ESC mặc định (chỉ chặn được một phần do bảo mật trình duyệt)
      if (e.key === 'Escape') {
        e.preventDefault(); 
        // Nhưng trình duyệt vẫn sẽ thoát Fullscreen, ta xử lý ở sự kiện fullscreenchange
      }

      // Xử lý Alt + Enter để hiện chuột (Unlock)
      if (e.altKey && e.key === 'Enter') {
        document.exitPointerLock();
        setIsLocked(false);
        setShowExitConfirm(true); // Hiện nút Nộp bài
      }
    };

    const handlePointerLockChange = () => {
      if (document.pointerLockElement === vmContainerRef.current) {
        setIsLocked(true);
        setShowExitConfirm(false);
      } else {
        setIsLocked(false);
        // Nếu chuột thoát ra mà không phải do bấm Alt+Enter (ví dụ bấm ESC),
        // Ta vẫn coi là trạng thái "tạm dừng"
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, []);

  // 3. LOGIC BẮT BUỘC TOÀN MÀN HÌNH (ANTI-CHEAT)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        // Tự động thoát Pointer Lock khi mất fullscreen
        document.exitPointerLock();
      } else {
        setIsFullscreen(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Hàm kích hoạt lại chế độ thi (Vào lại Fullscreen + Lock chuột)
  const resumeExam = async () => {
    try {
      await document.documentElement.requestFullscreen();
      vmContainerRef.current?.requestPointerLock();
      setIsFullscreen(true);
    } catch (err) {
      console.error("Lỗi vào fullscreen:", err);
    }
  };

  const startLock = () => {
    vmContainerRef.current?.requestPointerLock();
  };

  const handleSubmitExam = () => {
    // Gọi API nộp bài backend
    // Redirect ra trang kết quả
    router.push('/exam-finished');
  };

  // Format thời gian
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-900 text-white overflow-hidden select-none">
      
      {/* --- KHU VỰC 1: HEADER THÔNG TIN --- */}
      <div className="h-12 bg-gray-800 flex items-center justify-between px-4 border-b border-gray-700 z-50">
        <div className="text-sm font-mono space-x-4">
          <span className="text-yellow-400">Thí sinh: {studentInfo.name}</span>
          <span className="text-gray-400">|</span>
          <span className="text-green-400">User: {studentInfo.username}</span>
          <span className="text-gray-400">|</span>
          <span className="text-blue-400">IP: {studentInfo.ip}</span>
        </div>
        <div className="text-xl font-bold text-red-500 animate-pulse">
          Còn lại: {formatTime(timeLeft)}
        </div>
      </div>

      {/* --- KHU VỰC 2: THANH XANH MẢNH (Ranh giới) --- */}
      {/* Ngăn cách vật lý, user không thể di chuột qua đây khi đang lock */}
      <div className="h-[2px] w-full bg-cyan-500 shadow-[0_0_10px_cyan] z-50"></div>

      {/* --- KHU VỰC 3: MÁY ẢO & OVERLAY --- */}
      <div 
        ref={vmContainerRef} 
        className="flex-1 relative bg-black flex justify-center items-center overflow-hidden"
        onClick={startLock} // Bấm vào là lock chuột ngay
      >
        {/* Màn hình máy ảo VDI */}
        {/* Chỉ hiển thị rõ nét khi Fullscreen và Đang Lock chuột */}
        <div className={`w-full h-full transition-all duration-300 ${!isFullscreen ? 'blur-xl opacity-20' : ''}`}>
           <GuacamoleDisplay />
        </div>

        {/* --- CẢNH BÁO 1: MẤT FULLSCREEN (Che máy ảo) --- */}
        {!isFullscreen && (
          <div className="absolute inset-0 bg-red-900/90 z-[100] flex flex-col items-center justify-center text-center p-10">
            <h1 className="text-4xl font-bold text-white mb-4">⚠️ CẢNH BÁO VI PHẠM</h1>
            <p className="text-xl text-white mb-8">
              Bạn đã thoát chế độ toàn màn hình. Hành động này có thể bị ghi nhận là gian lận.
              <br/>Vui lòng quay lại làm bài ngay lập tức.
            </p>
            <button 
              onClick={resumeExam}
              className="px-8 py-4 bg-white text-red-900 font-bold text-xl rounded hover:bg-gray-200"
            >
              QUAY LẠI LÀM BÀI
            </button>
          </div>
        )}

        {/* --- CẢNH BÁO 2: CHUỘT BỊ UNLOCK (Hiện nút Nộp bài) --- */}
        {isFullscreen && !isLocked && (
          <div className="absolute inset-0 bg-black/60 z-[90] flex flex-col items-center justify-center">
            {/* Click vào vùng trống để làm tiếp */}
            <div 
              className="absolute inset-0 cursor-pointer" 
              onClick={startLock} 
              title="Click để tiếp tục làm bài"
            ></div>

            <div className="z-[91] bg-gray-800 p-6 rounded-lg shadow-2xl border border-gray-600 text-center pointer-events-auto">
              <h2 className="text-2xl font-bold text-white mb-2">Đang tạm dừng</h2>
              <p className="text-gray-300 mb-6">Click vào vùng tối bất kỳ để tiếp tục làm bài.</p>
              
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={startLock}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded"
                >
                  Làm bài tiếp
                </button>
                <button 
                  onClick={handleSubmitExam}
                  className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold"
                >
                  NỘP BÀI VÀ THOÁT
                </button>
              </div>
              <p className="mt-4 text-xs text-gray-500">Hoặc nhấn Alt + Enter lần nữa để ẩn menu này</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}