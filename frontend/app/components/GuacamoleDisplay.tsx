"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Guacamole from "guacamole-common-js";

// --- Types & Interfaces ---
interface GuacamoleDisplayProps {
  token: string | null;
  isLocked?: boolean; // Nhận trạng thái lock từ component cha
}

// --- Helper Functions ---

/**
 * Làm tròn kích thước để tránh mờ chữ và giảm tải việc resize liên tục
 */
function normalizeSize(value: number, multiple = 4, min = 100) {
  const v = Number(value);
  if (!Number.isFinite(v)) return min;
  const i = Math.max(min, Math.floor(v));
  return i - (i % multiple);
}

/**
 * Tạo URL WebSocket dựa trên domain hiện tại
 */
function buildWsCandidates(): string[] {
  if (typeof window === "undefined") return [];
  const loc = window.location;
  const wsProto = loc.protocol === "https:" ? "wss:" : "ws:";
  // Kết nối vào path /guaclite đã cấu hình ở Nginx
  return [`${wsProto}//${loc.host}/guaclite`];
}

/**
 * Giới hạn giá trị trong khoảng min-max
 */
function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// --- Main Component ---

export default function GuacamoleDisplay({ token, isLocked = false }: GuacamoleDisplayProps) {
  // Refs DOM & Guacamole Client
  const containerRef = useRef<HTMLDivElement>(null);
  const displayMountRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<any>(null);
  
  // Ref lưu trạng thái kết nối để truy cập tức thời trong event listener
  const stateRef = useRef<number>(0); 

  // Chuột ảo (Dùng cho chế độ Pointer Lock)
  const virtualMouse = useRef({ x: 0, y: 0 });

  // State React
  const [status, setStatus] = useState<string>("INITIALIZING");
  
  // Reconnect logic
  const wsCandidates = useMemo(() => buildWsCandidates(), []);
  const wsIndexRef = useRef<number>(0);
  const reconnectTimerRef = useRef<any>(null);
  const reconnectAttemptRef = useRef<number>(0);

  // --- 1. Hàm lấy kích thước màn hình ---
  const getBoxSize = () => {
    const box = containerRef.current;
    if (!box) return { w: 1024, h: 768, dpi: 96 };
    const rect = box.getBoundingClientRect();
    
    // Nếu chưa render xong
    if (rect.width === 0 || rect.height === 0) return { w: 1024, h: 768, dpi: 96 };

    const w = normalizeSize(rect.width, 4, 640);
    const h = normalizeSize(rect.height, 4, 480);
    const dpi = 96; 
    return { w, h, dpi };
  };

  // --- 2. Xử lý chuột khi bị KHÓA (Pointer Lock Logic) ---
  useEffect(() => {
    const handleLockedMouseMove = (e: MouseEvent) => {
      // Chỉ chạy khi đang khóa chuột và đã kết nối
      if (!isLocked || !clientRef.current) return;

      const { w, h } = getBoxSize();

      // Cộng dồn chuyển động (delta) vào tọa độ ảo
      virtualMouse.current.x += e.movementX;
      virtualMouse.current.y += e.movementY;

      // Giới hạn chuột không chạy ra ngoài màn hình máy ảo
      virtualMouse.current.x = clampInt(virtualMouse.current.x, 0, w);
      virtualMouse.current.y = clampInt(virtualMouse.current.y, 0, h);

      // Gửi tọa độ ảo đi (Chỉ gửi khi state === 3: CONNECTED)
      try {
        if (stateRef.current === 3) {
            clientRef.current.sendMouseState({
                x: virtualMouse.current.x,
                y: virtualMouse.current.y,
                left: (e.buttons & 1) === 1,
                middle: (e.buttons & 4) === 4,
                right: (e.buttons & 2) === 2,
                up: false,
                down: false,
            });
        }
      } catch (err) {
        // Ignored
      }
    };

    // Xử lý Click khi đang Lock
    const handleLockedClick = (e: MouseEvent) => {
        if (!isLocked || !clientRef.current) return;
        try {
            if (stateRef.current === 3) {
                clientRef.current.sendMouseState({
                    x: virtualMouse.current.x,
                    y: virtualMouse.current.y,
                    left: (e.buttons & 1) === 1,
                    middle: (e.buttons & 4) === 4,
                    right: (e.buttons & 2) === 2,
                    up: false,
                    down: false,
                });
            }
        } catch {}
    };

    if (isLocked) {
      document.addEventListener("mousemove", handleLockedMouseMove);
      document.addEventListener("mousedown", handleLockedClick);
      document.addEventListener("mouseup", handleLockedClick);
    }

    return () => {
      document.removeEventListener("mousemove", handleLockedMouseMove);
      document.removeEventListener("mousedown", handleLockedClick);
      document.removeEventListener("mouseup", handleLockedClick);
    };
  }, [isLocked]); 


  // --- 3. Quản lý Kết nối (Connection Lifecycle) ---
  useEffect(() => {
    let alive = true;

    // Hàm dọn dẹp kết nối cũ
    const hardCleanup = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      try {
        if (clientRef.current) {
          clientRef.current.disconnect();
        }
      } catch {}
      clientRef.current = null;
      stateRef.current = 0; // Reset state

      // Xóa canvas cũ
      try {
        if (displayMountRef.current) {
          displayMountRef.current.innerHTML = "";
        }
      } catch {}
    };

    // Hàm lập lịch Reconnect
    const scheduleReconnect = (reason: string) => {
      if (!alive || !token) return;
      const attempt = reconnectAttemptRef.current + 1;
      reconnectAttemptRef.current = attempt;
      const delay = Math.min(1000 + attempt * 1000, 5000); // Backoff: 2s, 3s, ... max 5s

      setStatus(`RECONNECTING (${reason})...`);
      
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        if (!alive) return;
        hardCleanup();
        connectWithIndex(wsIndexRef.current);
      }, delay);
    };

    // Hàm Kết nối chính
    const connectWithIndex = (index: number) => {
      if (!alive || !token) return;

      const url = wsCandidates[index] || wsCandidates[0];
      wsIndexRef.current = index;

      hardCleanup();
      setStatus("CONNECTING...");

      // Khởi tạo Tunnel & Client
      const tunnel = new (Guacamole as any).WebSocketTunnel(url);
      const client = new (Guacamole as any).Client(tunnel);
      clientRef.current = client;

      // --- Error Handlers ---
      tunnel.onerror = (err: any) => {
        console.error("Tunnel Error:", err);
        // Chỉ reconnect nếu chưa kết nối thành công
        if (stateRef.current !== 3) scheduleReconnect("TUNNEL_ERROR");
      };

      client.onerror = (err: any) => {
        console.error("Client Error:", err);
        if (stateRef.current !== 3) scheduleReconnect("CLIENT_ERROR");
      };

      // --- State Change Handler ---
      client.onstatechange = (state: number) => {
        stateRef.current = state; // Cập nhật ref để dùng chỗ khác

        if (state === 3) { // 3 = CONNECTED
          setStatus("CONNECTED");
          reconnectAttemptRef.current = 0;
          
          // Gửi size màn hình ngay lập tức
          const { w, h, dpi } = getBoxSize();
          try { client.sendSize(w, h, dpi); } catch {}

          // Reset chuột ảo về giữa màn hình
          virtualMouse.current = { x: w / 2, y: h / 2 };

        } else if (state === 5) { // 5 = DISCONNECTED
          scheduleReconnect("DISCONNECTED");
        } else {
           // Các trạng thái trung gian (Connecting, Waiting...)
           const states = ["IDLE", "CONNECTING", "WAITING", "CONNECTED", "DISCONNECTING", "DISCONNECTED"];
           setStatus(states[state] || `STATE_${state}`);
        }
      };

      // --- Setup Display (Canvas) ---
      const display = client.getDisplay();
      const displayEl = display.getElement();
      
      // Style cho Canvas
      displayEl.style.cursor = isLocked ? 'none' : 'default'; // Ẩn chuột thật nếu đang lock
      displayEl.style.width = "100%";
      displayEl.style.height = "100%";
      displayEl.oncontextmenu = (e: any) => { e.preventDefault(); return false; }; // Chặn menu chuột phải

      if (displayMountRef.current) {
        displayMountRef.current.innerHTML = "";
        displayMountRef.current.appendChild(displayEl);
      }

      // --- Input: Mouse (Chế độ thường - Không Lock) ---
      const mouse = new (Guacamole as any).Mouse(displayEl);
      mouse.onmousedown = mouse.onmouseup = mouse.onmousemove = (s: any) => {
        // Chỉ xử lý khi KHÔNG lock chuột
        if (!isLocked && clientRef.current) {
            virtualMouse.current = { x: s.x, y: s.y }; // Đồng bộ vị trí
            try {
                // FIX LỖI 520: Chỉ gửi khi Connected
                if (stateRef.current === 3) client.sendMouseState(s);
            } catch {}
        }
      };

      // --- Input: Keyboard (Toàn trang) ---
      const keyboard = new (Guacamole as any).Keyboard(document);
      keyboard.onkeydown = (keysym: any) => {
         try { if (stateRef.current === 3) client.sendKeyEvent(1, keysym); } catch {}
      };
      keyboard.onkeyup = (keysym: any) => {
         try { if (stateRef.current === 3) client.sendKeyEvent(0, keysym); } catch {}
      };

      // --- Thực hiện Connect ---
      const { w, h, dpi } = getBoxSize();
      const params = new URLSearchParams({
        token,
        width: String(w),
        height: String(h),
        dpi: String(dpi),
      });

      try {
        client.connect(params.toString());
      } catch (e) {
        scheduleReconnect("CONNECT_EXCEPTION");
      }
    };

    // Bắt đầu
    if (token) {
        connectWithIndex(0);
    } else {
        setStatus("NO_TOKEN");
    }

    return () => {
        alive = false;
        hardCleanup();
    };
  }, [token, wsCandidates]); // Dependency tối thiểu để tránh reconnect không cần thiết


  // --- 4. Xử lý Resize (Debounce) ---
  useEffect(() => {
    let resizeTimer: any;
    const handleResize = () => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (clientRef.current && stateRef.current === 3) {
                const { w, h, dpi } = getBoxSize();
                try { clientRef.current.sendSize(w, h, dpi); } catch {}
            }
        }, 200); // Đợi 200ms sau khi ngừng kéo cửa sổ
    };

    window.addEventListener("resize", handleResize);
    return () => {
        window.removeEventListener("resize", handleResize);
        if (resizeTimer) clearTimeout(resizeTimer);
    };
  }, []);


  // --- 5. Cập nhật Cursor khi Lock thay đổi ---
  useEffect(() => {
    const displayEl = displayMountRef.current?.firstChild as HTMLElement;
    if (displayEl) {
        displayEl.style.cursor = isLocked ? 'none' : 'default';
    }
  }, [isLocked]);


  // --- Render ---
  return (
    <div 
      ref={containerRef} 
      className="w-full h-full bg-black relative overflow-hidden flex items-center justify-center select-none"
    >
      {/* Loading / Status Overlay */}
      {status !== "CONNECTED" && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gray-900 text-white p-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500 mb-4 shadow-[0_0_15px_cyan]"></div>
            <p className="font-mono text-sm tracking-wide">{status}</p>
        </div>
      )}

      {/* Mount Point cho Guacamole Canvas */}
      <div ref={displayMountRef} className="w-full h-full" />
    </div>
  );
}