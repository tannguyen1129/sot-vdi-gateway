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
  const hasConnected = useRef(false);

  const [status, setStatus] = useState("INITIALIZING");

  useEffect(() => {
    if (!token || hasConnected.current) return;
    hasConnected.current = true;

    const connectVDI = () => {
      try {
        setStatus("CONNECTING");

        // ✅ Dùng wss nếu website đang chạy https
        const wsProto = window.location.protocol === "https:" ? "wss" : "ws";

        // Nếu backend WS của bạn đang ở :3000 như cũ thì giữ nguyên
        const wsUrl = `${wsProto}://${window.location.hostname}:3000/guaclite`;

        const tunnel = new Guacamole.WebSocketTunnel(wsUrl);
        const client = new Guacamole.Client(tunnel);
        clientRef.current = client;

        // ✅ Track state theo CLIENT (ổn định hơn tunnel)
        client.onstatechange = (state: number) => {
          // 0 IDLE, 1 CONNECTING, 2 WAITING, 3 CONNECTED, 4 DISCONNECTING, 5 DISCONNECTED
          const map = ["IDLE", "CONNECTING", "WAITING", "CONNECTED", "DISCONNECTING", "DISCONNECTED"];
          setStatus(map[state] || `STATE_${state}`);
        };

        client.onerror = (e: any) => {
          console.error("Guac Error:", e);
          setStatus(`ERROR: ${e?.message || "Connection failed"}`);
        };

        tunnel.onerror = (e: any) => {
          console.error("Tunnel Error:", e);
        };

        const displayEl = client.getDisplay().getElement();

        // ✅ để bắt phím cho chắc
        (displayEl as any).tabIndex = 0;
        displayEl.addEventListener("click", () => (displayEl as any).focus());

        if (displayRef.current) {
          displayRef.current.innerHTML = "";
          displayRef.current.appendChild(displayEl);
        }

        // Lấy size khung
        let width = 1024;
        let height = 768;
        if (containerRef.current) {
          width = containerRef.current.clientWidth;
          height = containerRef.current.clientHeight;
        }

        // ✅ FIX QUAN TRỌNG: encode token bằng URLSearchParams (tránh '+' -> space)
        const params = new URLSearchParams({
          token: token, // URLSearchParams sẽ encode an toàn
          width: String(width),
          height: String(height),
        });

        client.connect(params.toString());

        // Mouse
        const mouse = new Guacamole.Mouse(displayEl) as any;
        displayEl.oncontextmenu = (e: any) => {
          e.preventDefault();
          return false;
        };
        mouse.onmousedown = mouse.onmouseup = mouse.onmousemove = (s: any) => {
          clientRef.current?.sendMouseState(s);
        };

        // Keyboard (gắn vào displayEl thay vì document cho đỡ “ăn” toàn trang)
        const kbd = new Guacamole.Keyboard(displayEl) as any;
        kbd.onkeydown = (k: any) => clientRef.current?.sendKeyEvent(1, k);
        kbd.onkeyup = (k: any) => clientRef.current?.sendKeyEvent(0, k);

        // Resize realtime
        const handleResize = () => {
          if (!clientRef.current || !containerRef.current) return;
          const w = containerRef.current.clientWidth;
          const h = containerRef.current.clientHeight;
          clientRef.current.sendSize(w, h);
        };

        window.addEventListener("resize", handleResize);

        // Nếu container đổi size do layout (topbar, fullscreen...), bắt luôn bằng ResizeObserver
        const ro = new ResizeObserver(handleResize);
        if (containerRef.current) ro.observe(containerRef.current);

        // Cleanup
        return () => {
          ro.disconnect();
          window.removeEventListener("resize", handleResize);
          try {
            clientRef.current?.disconnect();
          } catch {}
        };
      } catch (err) {
        console.error(err);
        setStatus("CLIENT_EXCEPTION");
      }
    };

    const cleanup = connectVDI();

    return () => {
      try {
        cleanup && (cleanup as any)();
      } catch {}
    };
  }, [token]);

  const isConnected = status === "CONNECTED";

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
      <div ref={displayRef} className="shadow-2xl bg-black" />
    </div>
  );
}
