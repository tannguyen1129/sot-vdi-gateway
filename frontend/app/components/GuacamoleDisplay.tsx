// frontend/app/components/GuacamoleDisplay.tsx
"use client";
import React, { useEffect, useRef, useState } from "react";
import Guacamole from "guacamole-common-js";

interface GuacamoleDisplayProps {
  token: string | null;
}

export default function GuacamoleDisplay({ token }: GuacamoleDisplayProps) {
  const displayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<any>(null);

  const lastTokenRef = useRef<string | null>(null);

  const [status, setStatus] = useState("INITIALIZING");
  const [stateNum, setStateNum] = useState<number>(0); // 0..5 theo Guacamole

  useEffect(() => {
    // Cleanup helper
    let ro: ResizeObserver | null = null;
    let resizeTimer: any = null;
    let lastW = 0;
    let lastH = 0;
    let removeClick: null | (() => void) = null;

    const safeDisconnect = () => {
      try {
        clientRef.current?.disconnect();
      } catch {}
      clientRef.current = null;

      try {
        if (displayRef.current) displayRef.current.innerHTML = "";
      } catch {}
    };

    // Nếu token null -> dọn phiên cũ
    if (!token) {
      setStatus("NO_TOKEN");
      setStateNum(5);
      safeDisconnect();
      lastTokenRef.current = null;
      return;
    }

    // Token không đổi và đã có client -> khỏi connect lại
    if (lastTokenRef.current === token && clientRef.current) return;
    lastTokenRef.current = token;

    // Nếu đang có phiên cũ -> disconnect sạch trước khi connect mới
    safeDisconnect();

    const connectVDI = () => {
      setStatus("CONNECTING");
      setStateNum(1);

      // ✅ Dùng wss nếu website đang chạy https
      const wsProto = window.location.protocol === "https:" ? "wss" : "ws";
      const wsUrl = `${wsProto}://${window.location.hostname}:3000/guaclite`;

      const tunnel = new Guacamole.WebSocketTunnel(wsUrl);
      const client = new Guacamole.Client(tunnel);
      clientRef.current = client;

      // ---- Helpers lấy size
      const getBoxSize = () => {
        const box = containerRef.current;
        let w = 1024;
        let h = 768;

        if (box) {
          const cw = box.clientWidth;
          const ch = box.clientHeight;
          if (cw >= 100) w = cw;
          if (ch >= 100) h = ch;
        }
        return { w, h };
      };

      // ---- Resize realtime (định nghĩa TRƯỚC khi connect để tránh TDZ)
      const sendSizeNow = (force = false) => {
        const c = clientRef.current;
        const box = containerRef.current;
        if (!c || !box) return;

        const w = box.clientWidth;
        const h = box.clientHeight;

        // tránh gửi size 0 gây kẹt/đen
        if (w < 100 || h < 100) return;

        // Chỉ gửi khi CONNECTED, trừ khi force
        if (!force && stateNum !== 3) return;

        // tránh loop do dao động 1-2px
        if (!force && Math.abs(w - lastW) < 4 && Math.abs(h - lastH) < 4) return;

        lastW = w;
        lastH = h;

        try {
          c.sendSize(w, h);
        } catch {}
      };

      const sendSizeDebounced = (force = false) => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => sendSizeNow(force), 200);
      };

      const handleResize = () => sendSizeDebounced(false);

      // ✅ Track state theo CLIENT
      client.onstatechange = (s: number) => {
        setStateNum(s);
        const map = ["IDLE", "CONNECTING", "WAITING", "CONNECTED", "DISCONNECTING", "DISCONNECTED"];
        const label = map[s] || `STATE_${s}`;
        setStatus(label);

        // ✅ Kick render frame đầu khi CONNECTED
        if (s === 3) {
          setTimeout(() => {
            // Force send size ngay khi connected
            sendSizeNow(true);

            // Kick mouse nhẹ (booleans chuẩn)
            try {
              client.sendMouseState({
                x: 1,
                y: 1,
                left: false,
                middle: false,
                right: false,
                up: false,
                down: false,
              } as any);
            } catch {}
          }, 150);
        }
      };

      client.onerror = (e: any) => {
        console.error("Guac Error:", e);
        setStatus(`ERROR: ${e?.message || "Connection failed"}`);
      };

      tunnel.onerror = (e: any) => {
        console.error("Tunnel Error:", e);
      };

      const displayEl = client.getDisplay().getElement();

      // ✅ bắt phím cho chắc + full size
      (displayEl as any).tabIndex = 0;
      displayEl.style.width = "100%";
      displayEl.style.height = "100%";
      displayEl.style.outline = "none";
      // tránh browser gesture làm “kẹt” mouse
      (displayEl as any).style.touchAction = "none";

      const onClick = () => (displayEl as any).focus?.();
      displayEl.addEventListener("click", onClick);
      removeClick = () => displayEl.removeEventListener("click", onClick);

      if (displayRef.current) {
        displayRef.current.innerHTML = "";
        displayRef.current.appendChild(displayEl);
      }

      // ---- Connect params (lấy size khung ban đầu)
      const { w, h } = getBoxSize();
      console.log(`Connecting RDP with resolution: ${w}x${h}`);

      const params = new URLSearchParams({
        token,
        width: String(w),
        height: String(h),
        dpi: "96",
      });

      // Gắn resize listeners TRƯỚC connect để không miss frame đầu
      window.addEventListener("resize", handleResize);

      ro = new ResizeObserver(() => sendSizeDebounced(false));
      if (containerRef.current) ro.observe(containerRef.current);

      // Connect
      client.connect(params.toString());

      // ---- Mouse (normalize 0/1 => boolean)
      const mouse = new Guacamole.Mouse(displayEl) as any;

      displayEl.oncontextmenu = (e: any) => {
        e.preventDefault();
        return false;
      };

      const normalizeMouseState = (s: any) => ({
        ...s,
        left: !!s.left,
        middle: !!s.middle,
        right: !!s.right,
        up: !!s.up,
        down: !!s.down,
      });

      mouse.onmousedown = mouse.onmouseup = mouse.onmousemove = (s: any) => {
        try {
          clientRef.current?.sendMouseState(normalizeMouseState(s) as any);
        } catch {}
      };

      // ---- Keyboard (true/false)
      const kbd = new Guacamole.Keyboard(displayEl) as any;
      kbd.onkeydown = (k: any) => {
        try {
          clientRef.current?.sendKeyEvent(true, k);
        } catch {}
      };
      kbd.onkeyup = (k: any) => {
        try {
          clientRef.current?.sendKeyEvent(false, k);
        } catch {}
      };

      // Cleanup
      return () => {
        try {
          clearTimeout(resizeTimer);
        } catch {}

        try {
          ro?.disconnect();
        } catch {}
        ro = null;

        try {
          window.removeEventListener("resize", handleResize);
        } catch {}

        try {
          removeClick?.();
        } catch {}
        removeClick = null;

        safeDisconnect();
      };
    };

    const cleanup = connectVDI();

    return () => {
      try {
        cleanup && cleanup();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const isConnected = stateNum === 3;

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-black flex items-center justify-center relative overflow-hidden"
    >
      {!isConnected && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>{status}</p>
          </div>
        </div>
      )}
      <div ref={displayRef} className="w-full h-full bg-black" />
    </div>
  );
}
