"use client";

import React, { useEffect, useState, useRef } from 'react';
import GuacamoleDisplay from './GuacamoleDisplay';
import { useRouter } from 'next/navigation';
import api from '../utils/axios'; // Import API để gọi log

// Định nghĩa Interface cho thông tin hiển thị
export interface StudentInfo {
  name: string;       // Tên sinh viên
  username: string;   // Mã số sinh viên
  clientIp: string;   // IP của máy sinh viên đang ngồi
  vmIp: string;       // IP của máy ảo (Máy thi)
  vmUsername: string; // Username của máy ảo
  timeLeft: number;   // Thời gian còn lại (giây)
}

interface ExamInterfaceProps {
  studentInfo: StudentInfo;
  token: string;
  examId: number; // [MỚI] ID kỳ thi để log
  userId: number; // [MỚI] ID thí sinh để log
}

export default function ExamInterface({ studentInfo, token, examId, userId }: ExamInterfaceProps) {
  // --- STATES ---
  const [timeLeft, setTimeLeft] = useState(studentInfo.timeLeft);
  const [isLocked, setIsLocked] = useState(false);       // Trạng thái khóa chuột
  const [isFullscreen, setIsFullscreen] = useState(false); // Trạng thái toàn màn hình
  const [showExitConfirm, setShowExitConfirm] = useState(false); // Hiển thị menu thoát
  const [hasStarted, setHasStarted] = useState(false);   // Đã bấm nút Bắt đầu chưa
  
  const vmContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // --- HÀM GHI LOG GIÁM SÁT (MONITORING) ---
  const logActivity = async (action: string, details: string = "") => {
    try {
      await api.post('/monitoring/log', {
        examId,
        userId,
        action,
        details: details || `VM: ${studentInfo.vmIp} (${studentInfo.vmUsername})`,
        clientIp: studentInfo.clientIp
      });
    } catch (e) {
      console.error("Lỗi gửi log giám sát:", e);
    }
  };

  // --- 1. LOGIC KHỞI TẠO & RỜI KHỎI (JOIN / LEAVE) ---
  useEffect(() => {
    // 1. Log JOIN khi vào trang
    logActivity('JOIN', 'Thí sinh đã truy cập giao diện thi');

    // 2. Log LEAVE khi đóng tab / reload (Dùng sendBeacon để đảm bảo gửi được khi hủy trang)
    const handleUnload = () => {
        const data = JSON.stringify({ 
            examId, 
            userId, 
            action: 'LEAVE', 
            details: 'Thí sinh đóng tab hoặc reload trang',
            clientIp: studentInfo.clientIp 
        });
        // Lưu ý: Cần đường dẫn đầy đủ nếu API khác domain, ở đây giả sử cùng domain qua proxy
        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon('/api/monitoring/log', blob); 
    };
    
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  // --- 2. LOGIC ĐỒNG HỒ ĐẾM NGƯỢC ---
  useEffect(() => {
    if (!hasStarted) return; // Chỉ đếm khi đã bắt đầu làm bài

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          handleSubmitExam("Hết giờ làm bài!"); // Tự động nộp
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted]);

  // --- 3. LOGIC SỰ KIỆN: KHÓA CHUỘT & PHÍM TẮT ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault(); 
      }

      // Phím tắt Alt + Enter: Mở khóa chuột
      if (e.altKey && e.key === 'Enter') {
        if (document.pointerLockElement) {
            document.exitPointerLock();
            setIsLocked(false);
            setShowExitConfirm(true);
            
            // [LOG] Mở khóa chuột
            if (hasStarted) {
                logActivity('UNLOCK_MOUSE', 'Thí sinh bấm Alt+Enter để hiện chuột thật');
            }
        } else {
            attemptLock();
        }
      }
    };

    const handlePointerLockChange = () => {
      if (document.pointerLockElement === vmContainerRef.current) {
        setIsLocked(true);
        setShowExitConfirm(false);
      } else {
        setIsLocked(false);
        if (hasStarted) {
            setShowExitConfirm(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [hasStarted]);

  // --- 4. LOGIC THEO DÕI TOÀN MÀN HÌNH (ANTI-CHEAT) ---
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
        
        // [LOG] Vi phạm thoát toàn màn hình
        if (hasStarted) {
            logActivity('VIOLATION_FULLSCREEN', 'Phát hiện thoát chế độ toàn màn hình!');
        }
      } else {
        setIsFullscreen(true);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [hasStarted]); // Thêm hasStarted để chỉ log khi đã thi

  // --- HELPER FUNCTIONS ---

  const startExamSession = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
      attemptLock();
      setHasStarted(true);
      setIsFullscreen(true);
      
      // [LOG] Bắt đầu làm bài
      logActivity('START', 'Thí sinh bấm nút Bắt đầu làm bài');
    } catch (err) {
      console.error("Lỗi kích hoạt chế độ thi:", err);
      alert("Vui lòng cho phép chế độ toàn màn hình để làm bài thi.");
    }
  };

  const attemptLock = () => {
    try {
        vmContainerRef.current?.requestPointerLock();
    } catch (e) {
        console.warn("Pointer lock failed:", e);
    }
  };

  const handleSubmitExam = (reason?: string) => {
    const submitReason = reason || 'Nộp bài chủ động';
    
    // [LOG] Nộp bài
    logActivity('SUBMIT', submitReason);

    if (reason) alert(reason);
    
    if (document.exitFullscreen) document.exitFullscreen();
    if (document.exitPointerLock) document.exitPointerLock();

    router.push('/dashboard'); 
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- RENDER ---
  return (
    <div className="flex flex-col h-screen w-screen bg-gray-900 text-white overflow-hidden select-none">
      
      {/* KHU VỰC HEADER */}
      <div className="h-16 bg-gray-800 flex items-center justify-between px-6 border-b border-gray-700 z-50 shrink-0 shadow-lg cursor-default">
        
        <div className="flex flex-col justify-center space-y-1 text-sm font-mono">
          <div className="flex items-center space-x-4 text-gray-300">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Thí sinh:</span>
              <span className="text-yellow-400 font-bold uppercase">{studentInfo.name}</span>
            </div>
            <div className="w-[1px] h-3 bg-gray-600"></div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">MSSV:</span>
              <span className="text-white">{studentInfo.username}</span>
            </div>
            <div className="w-[1px] h-3 bg-gray-600"></div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Client IP:</span>
              <span className="text-blue-300">{studentInfo.clientIp}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
             <div className="flex items-center space-x-2 bg-green-900/30 px-2 py-0.5 rounded border border-green-800/50">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-green-500 font-bold">MÁY THI: {studentInfo.vmIp}</span>
             </div>
             <div className="text-gray-400 text-xs">
                (User: {studentInfo.vmUsername})
             </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="text-xs text-gray-400 mb-1">Thời gian còn lại</div>
          <div className={`text-3xl font-bold font-mono tracking-widest px-4 py-1 rounded border ${timeLeft < 300 ? 'text-red-500 border-red-900 bg-red-900/20 animate-pulse' : 'text-white border-gray-600 bg-black/40'}`}>
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      <div className="h-[2px] w-full bg-cyan-500 shadow-[0_0_15px_cyan] z-50 shrink-0"></div>

      {/* KHU VỰC MÁY ẢO */}
      <div 
        ref={vmContainerRef} 
        className={`flex-1 relative bg-black flex justify-center items-center overflow-hidden group ${isLocked ? 'cursor-none' : 'cursor-default'}`} 
        onClick={() => { if(hasStarted && !isLocked) attemptLock(); }} 
      >
        <div className={`w-full h-full transition-all duration-500 ${(!isFullscreen && hasStarted) || (showExitConfirm && hasStarted) ? 'blur-lg opacity-30 scale-95' : 'scale-100 opacity-100'}`}>
           <GuacamoleDisplay token={token} isLocked={isLocked} />
        </div>

        {/* 1. Màn hình chờ */}
        {!hasStarted && (
             <div className="absolute inset-0 bg-gray-900 z-[100] flex flex-col items-center justify-center p-8 cursor-default">
                <div className="max-w-2xl text-center">
                    <h1 className="text-4xl font-bold text-white mb-6">Sẵn sàng làm bài thi?</h1>
                    <p className="text-gray-400 mb-8 text-lg">
                        Hệ thống sẽ chuyển sang chế độ <strong>Toàn màn hình</strong> và <strong>Khóa chuột</strong>.
                        <br/>Vui lòng không thoát khỏi chế độ này.
                    </p>
                    <button 
                        onClick={startExamSession}
                        className="px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-2xl rounded-xl shadow-2xl transform hover:scale-105 transition-all cursor-pointer"
                    >
                        BẮT ĐẦU LÀM BÀI
                    </button>
                    <p className="mt-6 text-sm text-gray-500">
                        Phím tắt hỗ trợ: <strong className="text-gray-300">Alt + Enter</strong> để hiện chuột / tạm dừng.
                    </p>
                </div>
             </div>
        )}

        {/* 2. Cảnh báo vi phạm */}
        {hasStarted && !isFullscreen && (
          <div className="absolute inset-0 bg-red-950/95 z-[100] flex flex-col items-center justify-center text-center p-10 backdrop-blur-sm cursor-default">
            <div className="bg-red-900/80 p-10 rounded-3xl border-2 border-red-500 shadow-[0_0_50px_rgba(220,38,38,0.5)]">
                <h1 className="text-5xl font-bold text-white mb-6 uppercase tracking-wider">⚠️ CẢNH BÁO</h1>
                <p className="text-2xl text-red-100 mb-8 leading-relaxed">
                  Bạn đã thoát chế độ toàn màn hình!
                  <br/><span className="text-sm opacity-80">(Hành động này đã được ghi lại)</span>
                </p>
                <button 
                  onClick={startExamSession}
                  className="px-12 py-4 bg-white text-red-900 font-bold text-xl rounded-full hover:bg-gray-100 shadow-xl cursor-pointer"
                >
                  QUAY LẠI LÀM BÀI NGAY
                </button>
            </div>
          </div>
        )}

        {/* 3. Menu Tạm dừng */}
        {hasStarted && isFullscreen && (!isLocked || showExitConfirm) && (
          <div className="absolute inset-0 bg-black/60 z-[90] flex flex-col items-center justify-center backdrop-blur-sm cursor-default">
            <div className="absolute inset-0" onClick={attemptLock} title="Click để tiếp tục"></div>

            <div className="z-[91] bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-600 text-center min-w-[400px] pointer-events-auto">
              <h2 className="text-2xl font-bold text-white mb-2">Đang tạm dừng</h2>
              <p className="text-gray-400 mb-8">Click ra ngoài hoặc bấm nút dưới để tiếp tục.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={attemptLock}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Làm bài tiếp
                </button>
                <button 
                  onClick={() => handleSubmitExam("Đã nộp bài thành công.")}
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors cursor-pointer"
                >
                  NỘP BÀI & THOÁT
                </button>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-700 flex justify-between text-xs text-gray-500">
                <span>Trạng thái: <strong>An toàn</strong></span>
                <span>Mở menu: <strong>Alt + Enter</strong></span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}