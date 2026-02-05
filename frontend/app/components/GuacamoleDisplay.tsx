"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Guacamole from "guacamole-common-js";

// --- Types & Interfaces ---
interface GuacamoleDisplayProps {
  token: string | null;
  isLocked?: boolean; 
  onActivity?: () => void; 
}

// --- Helper Functions ---
function buildWsCandidates(): string[] {
  if (typeof window === "undefined") return [];
  const loc = window.location;
  const wsProto = loc.protocol === "https:" ? "wss:" : "ws:";
  return [`${wsProto}//${loc.host}/guaclite`];
}

// Hàm kẹp giá trị để chuột không chạy ra khỏi màn hình
function clamp(val: number, min: number, max: number) {
    return Math.min(Math.max(val, min), max);
}

export default function GuacamoleDisplay({ token, isLocked = false, onActivity }: GuacamoleDisplayProps) {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const displayMountRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<any>(null);
  
  // States
  const [status, setStatus] = useState<string>("INITIALIZING");
  const [hasDimensions, setHasDimensions] = useState(false); 

  // Mutable Refs 
  const stateRef = useRef<number>(0); 
  
  // [FIX QUAN TRỌNG] Ref theo dõi tọa độ chuột ảo khi bị khóa
  const virtualMouse = useRef({ x: 0, y: 0 });
  
  // Activity Debounce
  const notifyActivity = useRef((() => {
    let lastCall = 0;
    return () => {
      const now = Date.now();
      if (now - lastCall > 2000 && onActivity) { 
        lastCall = now;
        onActivity();
      }
    };
  })()).current;

  // --- 1. THEO DÕI KÍCH THƯỚC ---
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
            if (!hasDimensions) setHasDimensions(true);
            
            // Resize động nếu đang kết nối
            if (clientRef.current && stateRef.current === 3) {
                const w = Math.floor(entry.contentRect.width);
                const h = Math.floor(entry.contentRect.height);
                try { clientRef.current.sendSize(w, h); } catch {}
            }
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [hasDimensions]); 

  // --- 2. XỬ LÝ CHUỘT KHI BỊ KHÓA (POINTER LOCK FIX) ---
  useEffect(() => {
    // Hàm xử lý di chuyển chuột khi đang Lock
    const handleLockedMouseMove = (e: MouseEvent) => {
       // Chỉ chạy khi đang bị khóa và đã kết nối
       if (!isLocked || !clientRef.current || stateRef.current !== 3) return;
       notifyActivity();

       // Lấy kích thước khung hình hiện tại
       let width = 1024, height = 768;
       if (containerRef.current) {
           const rect = containerRef.current.getBoundingClientRect();
           width = rect.width;
           height = rect.height;
       }

       // [FIX] Cộng dồn chuyển động (movementX/Y) vào tọa độ ảo
       virtualMouse.current.x += e.movementX;
       virtualMouse.current.y += e.movementY;

       // Giới hạn không cho chuột ảo chạy ra ngoài khung
       virtualMouse.current.x = clamp(virtualMouse.current.x, 0, width);
       virtualMouse.current.y = clamp(virtualMouse.current.y, 0, height);

       // Gửi tọa độ đã tính toán lên Server Guacamole
       try {
           clientRef.current.sendMouseState({
               x: virtualMouse.current.x,
               y: virtualMouse.current.y,
               left: (e.buttons & 1) === 1,
               middle: (e.buttons & 4) === 4,
               right: (e.buttons & 2) === 2,
               up: false, 
               down: false
           });
       } catch {}
    };

    // Hàm xử lý Click khi đang Lock
    const handleLockedClick = (e: MouseEvent) => {
        if (!isLocked || !clientRef.current || stateRef.current !== 3) return;
        notifyActivity();
        
        try {
            // Gửi trạng thái click tại vị trí chuột ảo hiện tại
            clientRef.current.sendMouseState({
               x: virtualMouse.current.x,
               y: virtualMouse.current.y,
               left: (e.buttons & 1) === 1,
               middle: (e.buttons & 4) === 4,
               right: (e.buttons & 2) === 2,
               up: false, 
               down: false
           });
        } catch {}
    };

    // Đăng ký sự kiện khi chế độ Lock được bật
    if (isLocked) {
        document.addEventListener("mousemove", handleLockedMouseMove);
        document.addEventListener("mousedown", handleLockedClick);
        document.addEventListener("mouseup", handleLockedClick);
        document.addEventListener("keydown", () => notifyActivity());
    }
    return () => {
        document.removeEventListener("mousemove", handleLockedMouseMove);
        document.removeEventListener("mousedown", handleLockedClick);
        document.removeEventListener("mouseup", handleLockedClick);
        document.removeEventListener("keydown", () => notifyActivity());
    };
  }, [isLocked]);

  // --- 3. KẾT NỐI GUACAMOLE ---
  useEffect(() => {
    if (!token || !hasDimensions) return;

    let cleanupFn = () => {};

    const connect = () => {
      if (clientRef.current) { try { clientRef.current.disconnect(); } catch {} }
      if (displayMountRef.current) displayMountRef.current.innerHTML = "";

      setStatus("CONNECTING...");

      const tunnel = new (Guacamole as any).WebSocketTunnel(buildWsCandidates()[0]);
      const client = new (Guacamole as any).Client(tunnel);
      clientRef.current = client;

      client.onerror = (error: any) => {
         console.error("Guac Client Error:", error);
         setStatus(`ERROR: ${error.message || 'Unknown'}`);
      };

      client.onstatechange = (state: number) => {
         stateRef.current = state;
         const stateText = { 0: "IDLE", 1: "CONNECTING", 2: "WAITING", 3: "CONNECTED", 4: "DISCONNECTING", 5: "DISCONNECTED" };
         const sText = (stateText as any)[state] || `STATE_${state}`;
         
         if (state === 3) {
             setStatus("CONNECTED");
             // Gửi size màn hình ngay lập tức khi kết nối
             if (containerRef.current) {
                 const rect = containerRef.current.getBoundingClientRect();
                 const w = Math.floor(rect.width);
                 const h = Math.floor(rect.height);
                 client.sendSize(w, h);
                 // Reset chuột ảo về giữa màn hình
                 virtualMouse.current = { x: w / 2, y: h / 2 };
             }
         } else if (state === 5) {
             setStatus("DISCONNECTED");
         } else {
             setStatus(sText);
         }
      };

      const display = client.getDisplay();
      const displayEl = display.getElement();
      
      displayEl.style.position = 'absolute';
      displayEl.style.top = '0';
      displayEl.style.left = '0';
      displayEl.style.width = '100%';
      displayEl.style.height = '100%';
      displayEl.style.zIndex = '10'; 
      displayEl.style.cursor = isLocked ? 'none' : 'default';
      displayEl.style.touchAction = 'none';

      if (displayMountRef.current) {
          displayMountRef.current.appendChild(displayEl);
      }

      // -- INPUT HANDLERS (Chỉ dùng khi KHÔNG KHÓA - Fallback) --
      const mouse = new (Guacamole as any).Mouse(displayEl);
      mouse.onmousedown = mouse.onmouseup = mouse.onmousemove = (s: any) => {
          // Nếu đang locked thì logic ở trên xử lý, ở đây chỉ xử lý khi unlocked
          if (!isLocked && clientRef.current) {
              notifyActivity();
              clientRef.current.sendMouseState(s);
          }
      };

      const keyboard = new (Guacamole as any).Keyboard(document);
      keyboard.onkeydown = (keysym: any) => {
          if (clientRef.current) {
              notifyActivity();
              clientRef.current.sendKeyEvent(1, keysym);
          }
      };
      keyboard.onkeyup = (keysym: any) => {
          if (clientRef.current) {
              clientRef.current.sendKeyEvent(0, keysym);
          }
      };

      // Connect Params
      const rect = containerRef.current!.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);

      const params = new URLSearchParams({
        token,
        width: String(width),
        height: String(height),
        dpi: "96" 
      });

      client.connect(params.toString());

      cleanupFn = () => {
          try { client.disconnect(); } catch {}
          if (displayMountRef.current) displayMountRef.current.innerHTML = "";
      };
    };

    connect();

    return () => { cleanupFn(); };
  }, [token, hasDimensions]); 

  // --- 4. RENDER ---
  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative bg-black flex items-center justify-center overflow-hidden"
    >
      {status !== "CONNECTED" && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#090b10] text-gray-400">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
            <p className="font-mono text-xs tracking-widest">{status}</p>
            {!hasDimensions && <p className="text-[10px] mt-2 text-gray-600 animate-pulse">Waiting for container size...</p>}
        </div>
      )}
      <div ref={displayMountRef} className="w-full h-full absolute inset-0" />
    </div>
  );
}