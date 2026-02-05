"use client";

import React, { useEffect, useState, useRef } from 'react';
import GuacamoleDisplay from './GuacamoleDisplay';
import { useRouter } from 'next/navigation';
import api from '../utils/axios';

// --- INTERFACES ---
export interface StudentInfo {
  name: string;
  username: string; // MSSV
  clientIp: string;
  vmIp: string;
  vmUsername: string;
  timeLeft: number;
}

interface ExamInterfaceProps {
  studentInfo: StudentInfo;
  token: string;
  examId: number;
  userId: number;
}

// --- MAIN COMPONENT ---
export default function ExamInterface({ studentInfo, token, examId, userId }: ExamInterfaceProps) {
  // --- STATES ---
  const [timeLeft, setTimeLeft] = useState(studentInfo.timeLeft);
  const [isLocked, setIsLocked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [violation, setViolation] = useState<string | null>(null);

  // --- REFS (Để xử lý logic không gây re-render) ---
  const isSubmittingRef = useRef(false); // Cờ báo hiệu đang nộp bài (để chặn log vi phạm)
  const isUnlockIntentRef = useRef(false); // Cờ báo hiệu chủ động mở menu (Alt+Enter)
  const vmContainerRef = useRef<HTMLDivElement>(null);
  const lastActivityRef = useRef<number>(Date.now()); // Thời điểm thao tác cuối
  const router = useRouter();

  // ==============================
  // 1. CORE LOGIC: LOGGING & API
  // ==============================

  const logActivity = async (action: string, details: string = "") => {
    // Không ghi log nếu đang trong quy trình nộp bài (trừ log SUBMIT chính nó)
    if (isSubmittingRef.current && action !== 'SUBMIT') return;
    try {
      await api.post('/monitoring/log', {
        examId, userId, action, 
        details: details || `VM: ${studentInfo.vmIp}`, 
        clientIp: studentInfo.clientIp
      });
    } catch (e) { console.error("Log failed:", e); }
  };

  // Hàm được gọi từ GuacamoleDisplay mỗi khi có thao tác chuột/phím
  const handleUserActivity = () => { lastActivityRef.current = Date.now(); };

  // LOGIC NỘP BÀI & THU HỒI VM NGAY LẬP TỨC
  const handleSubmitExam = async (reason?: string) => {
    isSubmittingRef.current = true; // [QUAN TRỌNG] Bật cờ để chặn mọi log vi phạm sau thời điểm này
    
    logActivity('SUBMIT', reason || 'Nộp bài chủ động');

    // Gọi API Backend để thu hồi VM NGAY
    try { await api.post(`/exams/${examId}/finish`); } catch (e) { console.error("Finish API error:", e); }

    if (reason) alert(reason);
    
    // Dọn dẹp và thoát
    if (document.exitFullscreen) document.exitFullscreen().catch(()=>{});
    if (document.exitPointerLock) document.exitPointerLock();
    router.push('/dashboard'); 
  };

  // ==============================
  // 2. EFFECTS: TIMERS & HEARTBEAT
  // ==============================

  // Init & Cleanup
  useEffect(() => {
    logActivity('JOIN', 'Truy cập vào phòng thi');
    const handleUnload = () => {
      if (isSubmittingRef.current) return;
      const data = JSON.stringify({ examId, userId, action: 'LEAVE', clientIp: studentInfo.clientIp });
      navigator.sendBeacon('/api/monitoring/log', new Blob([data], { type: 'application/json' }));
    };
    window.addEventListener('beforeunload', handleUnload);

    // [FIX HEARTBEAT] Gửi tín hiệu ACTIVE mỗi phút nếu có thao tác
    const heartbeatInterval = setInterval(() => {
       if (hasStarted && !isSubmittingRef.current && Date.now() - lastActivityRef.current < 60000) {
           logActivity('ACTIVE', 'Heartbeat signal (User active)');
       }
    }, 60000);

    return () => { window.removeEventListener('beforeunload', handleUnload); clearInterval(heartbeatInterval); };
  }, [hasStarted]);

  // Đồng hồ đếm ngược
  useEffect(() => {
    if (!hasStarted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          handleSubmitExam("Hết giờ làm bài! Hệ thống tự động nộp.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [hasStarted]);

  // ==============================
  // 3. ANTI-CHEAT ENGINE
  // ==============================
  
  const triggerViolation = (reason: string) => {
      if (!hasStarted || isSubmittingRef.current || violation) return;
      setViolation(reason);
      logActivity('VIOLATION', reason);
      if (document.pointerLockElement) document.exitPointerLock();
  };

  const resolveViolation = async () => {
      setViolation(null);
      isUnlockIntentRef.current = false;
      await startExamSession(); // Khóa lại ngay
  };

  useEffect(() => {
    // Xử lý phím tắt
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSubmittingRef.current) return;
      // Chặn các phím chức năng của trình duyệt/hệ thống
      if (['F12', 'F11', 'F5', 'ContextMenu', 'Meta'].includes(e.key) || (e.ctrlKey && e.key === 'r')) {
          e.preventDefault();
          if(e.key === 'Meta' || e.key === 'ContextMenu') triggerViolation('Sử dụng phím hệ thống (Windows/Menu)');
      }
      // Alt + Enter hợp lệ
      if (e.altKey && e.key === 'Enter') {
          isUnlockIntentRef.current = true; // Đánh dấu chủ động
          document.exitPointerLock();
          setIsLocked(false);
          setShowExitConfirm(true);
          logActivity('UNLOCK_MOUSE', 'Chủ động mở menu (Alt+Enter)');
          return;
      }
      // Alt + Tab vi phạm
      if (e.altKey && e.key === 'Tab') triggerViolation('Sử dụng Alt + Tab');
    };

    // Xử lý mất tiêu điểm (Blur)
    const handleBlur = () => {
        if (!hasStarted || isSubmittingRef.current) return;
        if (!isUnlockIntentRef.current && !showExitConfirm) triggerViolation('Mất tiêu điểm (Chuyển cửa sổ/Alt+Tab)');
    };

    // Xử lý chuột rời vùng (Mouse Leave)
    const handleMouseLeave = () => {
        if (!hasStarted || isSubmittingRef.current) return;
        if (!isUnlockIntentRef.current && !showExitConfirm && !isLocked) triggerViolation('Di chuyển chuột ra khỏi màn hình thi');
    };

    // Xử lý trạng thái khóa chuột (Pointer Lock)
    const handlePointerLockChange = () => {
      if (document.pointerLockElement === vmContainerRef.current) {
        setIsLocked(true); setShowExitConfirm(false);
      } else {
        setIsLocked(false);
        // Nếu mất lock mà không phải do Alt+Enter -> Vi phạm
        if (hasStarted && !isSubmittingRef.current && !isUnlockIntentRef.current) triggerViolation('Thoát khóa chuột trái phép');
      }
    };

    // Xử lý toàn màn hình (Fullscreen)
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        if (hasStarted && !isSubmittingRef.current) triggerViolation('Thoát chế độ toàn màn hình');
      } else {
        setIsFullscreen(true);
      }
    };

    // Attach listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Detach listeners
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasStarted, isLocked, showExitConfirm, violation]);

  // ==============================
  // 4. HELPER FUNCTIONS
  // ==============================

  const startExamSession = async () => {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      vmContainerRef.current?.requestPointerLock();
      setHasStarted(true); setIsFullscreen(true); setViolation(null); isUnlockIntentRef.current = false;
      logActivity('START', 'Bắt đầu làm bài thi');
    } catch (err) { alert("Hệ thống yêu cầu chế độ toàn màn hình để bắt đầu."); }
  };

  const attemptLock = () => { if (!violation && !showExitConfirm) vmContainerRef.current?.requestPointerLock(); };

  // [FIX] Format HH:mm:ss chuẩn
  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ==============================
  // 5. RENDER (UI/UX)
  // ==============================
  return (
    <div className="flex flex-col h-screen w-screen bg-[#090b10] text-gray-100 overflow-hidden select-none font-sans">
      
      {/* --- HEADER (Glassmorphism) --- */}
      <div className="h-14 bg-[#0f1117]/90 backdrop-blur-md flex items-center justify-between px-6 border-b border-gray-800/50 z-50 shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.2)] absolute top-0 w-full">
        
        {/* Left Info Stats */}
        <div className="flex items-center space-x-6">
          
          {/* Student Info & MSSV */}
          <div className="flex items-center gap-3 group">
             <div className="p-2 rounded-lg bg-gray-800/50 border border-gray-700/50 group-hover:border-blue-500/30 transition-colors">
                {/* Icon User */}
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
             </div>
             <div className="flex flex-col">
               <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Thí sinh</span>
               <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-gray-100">{studentInfo.name}</span>
                  <span className="text-xs text-gray-400 font-mono">({studentInfo.username})</span> {/* [FIX] Hiện MSSV */}
               </div>
             </div>
          </div>

          <div className="h-8 w-[1px] bg-gray-800"></div>

          {/* VM Info */}
          <div className="flex items-center gap-3 group hidden md:flex">
             <div className="p-2 rounded-lg bg-gray-800/50 border border-gray-700/50 group-hover:border-green-500/30 transition-colors">
                {/* Icon Monitor/VM */}
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
             </div>
             <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Máy thi</span>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                    <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
                    <span className="text-green-300">{studentInfo.vmIp}</span>
                </div>
             </div>
          </div>
        </div>

        {/* Right Timer */}
        <div className="flex items-center gap-3">
            <div className="text-right">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 block mb-0.5">Thời gian còn lại</span>
                {/* [FIX] Format HH:mm:ss */}
                <div className={`text-2xl font-mono font-bold tracking-wider ${timeLeft < 300 ? 'text-red-400 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.3)]'}`}>
                    {formatTime(timeLeft)}
                </div>
            </div>
            <div className={`p-2 rounded-lg border ${timeLeft < 300 ? 'bg-red-900/20 border-red-800' : 'bg-gray-800/50 border-gray-700/50'}`}>
                {/* Icon Clock */}
                <svg className={`w-6 h-6 ${timeLeft < 300 ? 'text-red-400' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
        </div>
      </div>

      {/* --- MAIN VM CONTAINER --- */}
      <div 
        ref={vmContainerRef} 
        className={`flex-1 relative bg-black flex justify-center items-center overflow-hidden mt-14 group outline-none ${isLocked ? 'cursor-none' : ''}`} 
        onClick={() => { if(hasStarted && !isLocked && !isSubmittingRef.current && !violation) attemptLock(); }} 
      >
        {/* Guacamole Screen with smooth blur/scale transition */}
        <div className={`w-full h-full transition-all duration-500 ease-out ${violation || (!isFullscreen && hasStarted) || showExitConfirm ? 'blur-md scale-[0.98] opacity-40 grayscale' : 'scale-100 opacity-100 grayscale-0'}`}>
           <GuacamoleDisplay token={token} isLocked={isLocked} onActivity={handleUserActivity} />
        </div>

        {/* ========================================= */}
        {/* OVERLAYS (MODALS & ALERTS) */}
        {/* ========================================= */}

        {/* 1. START SCREEN */}
        {!hasStarted && (
             <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#090b10]/80 backdrop-blur-sm p-6">
                <div className="bg-[#161b22] p-8 rounded-2xl border border-gray-700/50 shadow-2xl text-center max-w-lg relative overflow-hidden">
                    {/* Decor Background */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                    
                    <div className="mb-6 flex justify-center">
                        <div className="p-4 bg-blue-900/20 rounded-full border border-blue-500/30">
                             {/* Icon Play/Start */}
                            <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-3">Sẵn sàng làm bài thi?</h1>
                    <p className="text-gray-400 mb-8 text-sm leading-relaxed">
                        Hệ thống sẽ chuyển sang chế độ <strong>Toàn màn hình</strong> và <strong>Khóa chuột</strong>.
                        <br/>Mọi hành động thoát ra sẽ bị ghi lại là vi phạm.
                    </p>
                    <button onClick={startExamSession} className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl shadow-lg hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-2">
                        <span>BẮT ĐẦU NGAY</span>
                         {/* Icon Arrow Right */}
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </button>
                    <div className="mt-6 text-xs text-gray-500 flex justify-center items-center gap-2 bg-gray-800/50 py-2 rounded-lg">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span>Mở menu tạm dừng: <kbd className="font-mono border border-gray-600 rounded px-1 bg-gray-700">Alt</kbd> + <kbd className="font-mono border border-gray-600 rounded px-1 bg-gray-700">Enter</kbd></span>
                    </div>
                </div>
             </div>
        )}

        {/* 2. VIOLATION ALERT (Red Zone) */}
        {violation && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-red-950/90 backdrop-blur-md p-10 animate-in zoom-in duration-300">
            <div className="bg-[#1a0505] border-2 border-red-600/80 p-10 rounded-[2rem] shadow-[0_0_100px_rgba(220,38,38,0.4)] max-w-2xl text-center relative overflow-hidden">
                {/* Background Pulse */}
                <div className="absolute inset-0 bg-red-600/10 animate-pulse z-0"></div>
                
                <div className="relative z-10">
                    <div className="inline-flex p-5 rounded-full bg-red-600/20 mb-6 border border-red-500/50 shadow-[0_0_30px_rgba(220,38,38,0.3)]">
                        {/* Icon Warning Triangle Huge */}
                        <svg className="w-20 h-20 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h1 className="text-4xl font-black text-red-100 mb-2 uppercase tracking-wider drop-shadow-lg">Phát hiện vi phạm</h1>
                    <p className="text-red-400 font-mono text-sm mb-8 tracking-widest">SECURITY PROTOCOL ENGAGED</p>
                    
                    <div className="bg-red-950/60 border border-red-900/80 p-5 rounded-xl mb-8">
                        <p className="text-gray-400 text-xs uppercase font-bold mb-1">Lý do ghi nhận:</p>
                        <p className="text-xl text-red-100 font-bold">"{violation}"</p>
                    </div>

                    <button 
                      onClick={resolveViolation}
                      className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-red-500/40 transition-all w-full flex items-center justify-center gap-3 active:scale-95"
                    >
                      {/* Icon Refresh/Return */}
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      ĐÃ HIỂU VÀ QUAY LẠI THI
                    </button>
                </div>
            </div>
          </div>
        )}

        {/* 3. PAUSE MENU (Alt+Enter) */}
        {showExitConfirm && !violation && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#090b10]/80 backdrop-blur-md animate-in fade-in duration-200">
            {/* Backdrop Click to Resume */}
            <div className="absolute inset-0" onClick={attemptLock}></div>
            
            <div className="z-[51] bg-[#161b22] p-6 rounded-2xl border border-gray-700/50 shadow-2xl text-center min-w-[380px] relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gray-700 rounded-t-2xl"></div>
              
              <div className="mb-4 flex justify-center">
                 <div className="p-3 bg-gray-800/50 rounded-full border border-gray-700">
                     {/* Icon Pause/Lock Open */}
                    <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                 </div>
              </div>

              <h2 className="text-xl font-bold text-white mb-2">Tạm dừng bài thi</h2>
              <p className="text-gray-400 mb-6 text-sm">Chuột đã được mở khóa. Vui lòng chọn thao tác:</p>
              
              <div className="space-y-3">
                <button onClick={attemptLock} className="w-full py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gray-500 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2">
                  {/* Icon Play/Resume */}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Quay lại làm bài
                </button>
                <button onClick={() => handleSubmitExam("Xác nhận nộp bài.")} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2">
                  {/* Icon Check/Submit */}
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  NỘP BÀI & KẾT THÚC
                </button>
              </div>
              
              <div className="mt-5 pt-3 border-t border-gray-800 flex justify-center text-xs text-gray-500 cursor-pointer hover:text-gray-300 transition-colors" onClick={attemptLock}>
                Nhấn ra ngoài vùng này để quay lại nhanh
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}