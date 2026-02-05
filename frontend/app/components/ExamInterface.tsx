import React, { useEffect, useState, useRef } from 'react';
import GuacamoleDisplay from './GuacamoleDisplay';
import { useRouter } from 'next/navigation';

// Định nghĩa kiểu dữ liệu cho thông tin sinh viên
export interface StudentInfo {
  name: string;
  username: string;
  ip: string;
  timeLeft: number; // Thời gian làm bài tính bằng giây
}

// Định nghĩa Props cho component ExamInterface
interface ExamInterfaceProps {
  studentInfo: StudentInfo;
  token: string; // <--- FIX: Thêm token vào đây để nhận từ page.tsx
}

export default function ExamInterface({ studentInfo, token }: ExamInterfaceProps) {
  const [timeLeft, setTimeLeft] = useState(studentInfo.timeLeft);
  const [isLocked, setIsLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true); // Giả định ban đầu là true để kích hoạt flow
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
      // Chặn ESC mặc định để tránh thoát fullscreen ngoài ý muốn
      if (e.key === 'Escape') {
        e.preventDefault(); 
      }

      // Xử lý Alt + Enter để hiện chuột (Unlock / Pause) chủ động
      if (e.altKey && e.key === 'Enter') {
        if (document.pointerLockElement) {
            document.exitPointerLock();
            setIsLocked(false);
            setShowExitConfirm(true); // Hiện menu nộp bài
        } else {
            // Nếu bấm lại lần nữa thì resume
            startLock();
        }
      }
    };

    const handlePointerLockChange = () => {
      if (document.pointerLockElement === vmContainerRef.current) {
        setIsLocked(true);
        setShowExitConfirm(false);
      } else {
        setIsLocked(false);
        // Nếu chuột thoát ra mà không phải do logic nộp bài, hiện menu pause
        setShowExitConfirm(true);
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
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
      } else {
        setIsFullscreen(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Auto request fullscreen khi component mount (trải nghiệm tốt hơn)
    const requestFs = async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            }
        } catch (e) {
            // User interaction required errors are normal here
            console.log("Waiting for user interaction to fullscreen");
            setIsFullscreen(false);
        }
    };
    requestFs();

    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Hàm kích hoạt lại chế độ thi (Vào lại Fullscreen + Lock chuột)
  const resumeExam = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      startLock();
      setIsFullscreen(true);
    } catch (err) {
      console.error("Lỗi vào fullscreen:", err);
    }
  };

  const startLock = () => {
    vmContainerRef.current?.requestPointerLock();
    setShowExitConfirm(false);
  };

  const handleSubmitExam = () => {
    // Logic gọi API nộp bài sẽ đặt ở đây
    // Ví dụ: await api.post(`/exams/${examId}/submit`);
    router.push('/dashboard'); // Hoặc trang kết quả
  };

  // Format thời gian MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gray-900 text-white overflow-hidden select-none">
      
      {/* --- KHU VỰC 1: HEADER THÔNG TIN --- */}
      <div className="h-12 bg-gray-800 flex items-center justify-between px-4 border-b border-gray-700 z-50 shrink-0">
        <div className="text-sm font-mono space-x-4 flex items-center">
          <span className="text-yellow-400 font-bold">{studentInfo.name}</span>
          <span className="text-gray-500">|</span>
          <span className="text-green-400">User: {studentInfo.username}</span>
          <span className="text-gray-500">|</span>
          <span className="text-blue-400">IP: {studentInfo.ip}</span>
        </div>
        <div className="text-xl font-bold text-red-500 animate-pulse bg-gray-900 px-3 py-1 rounded border border-red-900">
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* --- KHU VỰC 2: THANH XANH MẢNH (Ranh giới an toàn) --- */}
      <div className="h-[2px] w-full bg-cyan-500 shadow-[0_0_10px_cyan] z-50 shrink-0"></div>

      {/* --- KHU VỰC 3: MÁY ẢO & OVERLAY --- */}
      <div 
        ref={vmContainerRef} 
        className="flex-1 relative bg-black flex justify-center items-center overflow-hidden group"
        onClick={startLock} // Bấm vào vùng đen là lock chuột ngay
      >
        {/* Màn hình máy ảo VDI */}
        {/* FIX: Truyền token vào component con */}
        <div className={`w-full h-full transition-all duration-300 ${!isFullscreen || showExitConfirm ? 'blur-md opacity-50 scale-[0.98]' : 'scale-100'}`}>
           <GuacamoleDisplay token={token} />
        </div>

        {/* --- CẢNH BÁO 1: MẤT FULLSCREEN (Che máy ảo) --- */}
        {!isFullscreen && (
          <div className="absolute inset-0 bg-red-950/95 z-[100] flex flex-col items-center justify-center text-center p-10 backdrop-blur-sm">
            <div className="bg-red-900 p-8 rounded-2xl shadow-2xl border-2 border-red-500 max-w-2xl">
                <h1 className="text-4xl font-bold text-white mb-6 uppercase tracking-wider">⚠️ Cảnh báo vi phạm</h1>
                <p className="text-xl text-red-100 mb-8 leading-relaxed">
                Hệ thống phát hiện bạn đã thoát chế độ toàn màn hình. 
                <br/>Hành động này có thể bị ghi nhận là gian lận.
                <br/><span className="font-bold text-white mt-4 block">Vui lòng quay lại làm bài ngay lập tức.</span>
                </p>
                <button 
                onClick={resumeExam}
                className="px-10 py-4 bg-white text-red-900 font-bold text-xl rounded-full hover:bg-gray-100 hover:scale-105 transition-all shadow-lg"
                >
                QUAY LẠI LÀM BÀI
                </button>
            </div>
          </div>
        )}

        {/* --- CẢNH BÁO 2: CHUỘT BỊ UNLOCK / MENU PAUSE --- */}
        {isFullscreen && (!isLocked || showExitConfirm) && (
          <div className="absolute inset-0 bg-black/60 z-[90] flex flex-col items-center justify-center backdrop-blur-sm">
            {/* Lớp phủ click để resume nhanh */}
            <div 
              className="absolute inset-0 cursor-pointer" 
              onClick={startLock} 
              title="Click để tiếp tục làm bài"
            ></div>

            <div className="z-[91] bg-gray-800 p-8 rounded-xl shadow-2xl border border-gray-600 text-center pointer-events-auto min-w-[400px]">
              <h2 className="text-2xl font-bold text-white mb-2">Đang tạm dừng</h2>
              <p className="text-gray-400 mb-8">Click vào vùng tối bất kỳ để tiếp tục làm bài.</p>
              
              <div className="flex gap-4 justify-center">
                <button 
                  onClick={startLock}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors w-full"
                >
                  Làm bài tiếp
                </button>
                <button 
                  onClick={handleSubmitExam}
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors w-full"
                >
                  NỘP BÀI
                </button>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-700 text-xs text-gray-500 flex justify-between">
                <span>Trạng thái: <strong>An toàn</strong></span>
                <span>Phím tắt: <strong>Alt + Enter</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}