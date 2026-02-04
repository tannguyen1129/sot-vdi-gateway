// frontend/app/components/GuacamoleDisplay.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Guacamole from "guacamole-common-js";

interface GuacamoleDisplayProps {
  token: string | null;
}

/**
 * ENV (optional)
 * - NEXT_PUBLIC_GUAC_WS_URL: full ws/wss url (vd: wss://domain.com/guaclite or ws://ip:3000/guaclite)
 * - NEXT_PUBLIC_GUAC_WS_BASE: base ws/wss/http/https (vd: wss://domain.com OR https://domain.com)
 *   -> sẽ nối thêm /guaclite
 */

function toWsBase(base: string, fallbackProto: "ws" | "wss") {
  const b = base.trim().replace(/\/$/, "");
  if (b.startsWith("ws://") || b.startsWith("wss://")) return b;
  if (b.startsWith("http://")) return "ws://" + b.slice("http://".length);
  if (b.startsWith("https://")) return "wss://" + b.slice("https://".length);
  return `${fallbackProto}://${b}`;
}

function buildWsCandidates(): string[] {
  if (typeof window === "undefined") return ["ws://localhost:3000/guaclite"];

  const wsProto: "ws" | "wss" = window.location.protocol === "https:" ? "wss" : "ws";

  const envUrl = process.env.NEXT_PUBLIC_GUAC_WS_URL?.trim();
  if (envUrl) return [envUrl];

  const envBase = process.env.NEXT_PUBLIC_GUAC_WS_BASE?.trim();
  if (envBase) {
    const base = toWsBase(envBase, wsProto);
    return [`${base}/guaclite`];
  }

  // Không có env: thử theo reverse proxy trước, nếu fail sẽ tự fallback sang :3000
  const primary = `${wsProto}://${window.location.host}/guaclite`;
  const fallback = `${wsProto}://${window.location.hostname}:3000/guaclite`;

  // tránh duplicate nếu host đã là :3000
  if (primary === fallback) return [primary];
  return [primary, fallback];
}

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function normalizeSize(value: number, multiple = 4, min = 100) {
  const v = Number(value);
  if (!Number.isFinite(v)) return min;
  const i = Math.max(min, Math.floor(v));
  return i - (i % multiple);
}

type MouseState = {
  x: number;
  y: number;
  left: boolean;
  middle: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
};

export default function GuacamoleDisplay({ token }: GuacamoleDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayMountRef = useRef<HTMLDivElement>(null);

  const clientRef = useRef<any>(null);
  const cleanupRef = useRef<null | (() => void)>(null);

  const reconnectTimerRef = useRef<any>(null);
  const reconnectAttemptRef = useRef<number>(0);

  const stateRef = useRef<number>(0); // 0..5
  const lastSizeRef = useRef<{ w: number; h: number; dpi: number }>({ w: 0, h: 0, dpi: 96 });

  const [status, setStatus] = useState<string>("INITIALIZING");
  const [stateNum, setStateNum] = useState<number>(0);

  const wsCandidates = useMemo(() => buildWsCandidates(), []);
  const wsIndexRef = useRef<number>(0);

  const isConnected = stateNum === 3;

  useEffect(() => {
    let alive = true;

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const hardCleanup = () => {
      clearReconnectTimer();

      try {
        cleanupRef.current?.();
      } catch {}
      cleanupRef.current = null;

      try {
        clientRef.current?.disconnect();
      } catch {}
      clientRef.current = null;

      try {
        if (displayMountRef.current) displayMountRef.current.innerHTML = "";
      } catch {}
    };

    const getBoxSize = () => {
      const box = containerRef.current;
      if (!box) return { w: 1024, h: 768, dpi: 96 };

      const rect = box.getBoundingClientRect();
      const w = normalizeSize(rect.width, 4, 640);
      const h = normalizeSize(rect.height, 4, 480);
      const dpi = clampInt(Math.floor((window.devicePixelRatio || 1) * 96), 96, 192);

      return { w, h, dpi };
    };

    const sendSizeNow = (force = false) => {
      const c = clientRef.current;
      const box = containerRef.current;
      if (!c || !box) return;

      if (!force && stateRef.current !== 3) return;

      const { w, h, dpi } = getBoxSize();
      const last = lastSizeRef.current;

      // tránh spam do dao động nhỏ
      if (!force && Math.abs(w - last.w) < 4 && Math.abs(h - last.h) < 4 && dpi === last.dpi) return;

      lastSizeRef.current = { w, h, dpi };

      try {
        c.sendSize(w, h, dpi);
      } catch {}
    };

    const scheduleReconnect = (reason: string) => {
      if (!alive) return;
      if (!token) return;

      const attempt = reconnectAttemptRef.current + 1;
      reconnectAttemptRef.current = attempt;

      // backoff có giới hạn + jitter
      const baseDelay = clampInt(600 + attempt * 700, 600, 4500);
      const jitter = Math.floor(Math.random() * 250);
      const delay = baseDelay + jitter;

      setStatus(`RECONNECTING (${reason}) [${attempt}]`);
      clearReconnectTimer();

      reconnectTimerRef.current = setTimeout(() => {
        if (!alive) return;
        hardCleanup();
        connectWithIndex(wsIndexRef.current);
      }, delay);
    };

    const shouldTryNextCandidate = (err: any) => {
      // Các case hay gặp khi WS không tới được backend (port/proxy)
      // - Status code 514: Server timeout
      // - WebSocket closed before established (thường báo trong console, đôi khi map thành 514)
      const code = err?.code;
      const msg = String(err?.message || "").toLowerCase();
      return code === 514 || msg.includes("timeout") || msg.includes("closed");
    };

    const connectWithIndex = (index: number) => {
      if (!alive) return;
      if (!token) return;

      const url = wsCandidates[index] || wsCandidates[0];
      wsIndexRef.current = index;

      // tránh chồng listeners
      hardCleanup();

      setStatus(`CONNECTING (${url})`);
      setStateNum(1);
      stateRef.current = 1;

      const tunnel = new (Guacamole as any).WebSocketTunnel(url);
      const client = new (Guacamole as any).Client(tunnel);
      clientRef.current = client;

      // ----- mount display
      const displayEl: HTMLElement = client.getDisplay().getElement();
      (displayEl as any).tabIndex = 0;
      displayEl.style.width = "100%";
      displayEl.style.height = "100%";
      displayEl.style.outline = "none";
      (displayEl as any).style.touchAction = "none";

      const focusDisplay = () => {
        try {
          (displayEl as any).focus?.();
        } catch {}
      };

      displayEl.addEventListener("click", focusDisplay);
      (displayEl as any).oncontextmenu = (e: any) => {
        e.preventDefault();
        return false;
      };

      if (displayMountRef.current) {
        displayMountRef.current.innerHTML = "";
        displayMountRef.current.appendChild(displayEl);
      }

      // ----- input: mouse
      const mouse = new (Guacamole as any).Mouse(displayEl);

      const toMouseState = (s: any): MouseState => ({
        x: Number(s?.x || 0),
        y: Number(s?.y || 0),
        left: !!s?.left,
        middle: !!s?.middle,
        right: !!s?.right,
        up: !!s?.up,
        down: !!s?.down,
      });

      mouse.onmousedown = mouse.onmouseup = mouse.onmousemove = (s: any) => {
        try {
          clientRef.current?.sendMouseState(toMouseState(s));
        } catch {}
      };

      // ----- input: keyboard
      const keyboard = new (Guacamole as any).Keyboard(displayEl);
      keyboard.onkeydown = (keysym: any) => {
        try {
          clientRef.current?.sendKeyEvent(true, keysym);
        } catch {}
      };
      keyboard.onkeyup = (keysym: any) => {
        try {
          clientRef.current?.sendKeyEvent(false, keysym);
        } catch {}
      };

      // ----- resize observers (debounce)
      let resizeTimer: any = null;
      const debouncedResize = (force = false) => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => sendSizeNow(force), 150);
      };

      const onWindowResize = () => debouncedResize(false);

      const ro = new ResizeObserver(() => debouncedResize(false));
      if (containerRef.current) ro.observe(containerRef.current);

      window.addEventListener("resize", onWindowResize);

      // ----- error handling (tunnel)
      tunnel.onerror = (err: any) => {
        console.error("Guacamole tunnel error:", err);

        // Nếu đang thử reverse proxy mà fail -> tự fallback sang :3000 (hoặc candidate kế tiếp)
        const nextIndex = wsIndexRef.current + 1;
        if (nextIndex < wsCandidates.length && shouldTryNextCandidate(err) && stateRef.current !== 3) {
          setStatus(`FALLBACK WS -> ${wsCandidates[nextIndex]}`);
          hardCleanup();
          connectWithIndex(nextIndex);
          return;
        }

        scheduleReconnect(err?.message || "TUNNEL_ERROR");
      };

      // ----- state tracking
      client.onstatechange = (s: number) => {
        stateRef.current = s;
        setStateNum(s);

        const map = ["IDLE", "CONNECTING", "WAITING", "CONNECTED", "DISCONNECTING", "DISCONNECTED"];
        const label = map[s] || `STATE_${s}`;
        setStatus(label);

        if (s === 3) {
          // connected: reset backoff, lock candidate index
          reconnectAttemptRef.current = 0;

          // kick size ngay khi connect
          setTimeout(() => {
            sendSizeNow(true);
            // kick nhẹ mouse state để render frame đầu ổn định
            try {
              client.sendMouseState({ x: 1, y: 1, left: false, middle: false, right: false, up: false, down: false });
            } catch {}
          }, 80);
        }

        if (s === 5) {
          scheduleReconnect("DISCONNECTED");
        }
      };

      client.onerror = (e: any) => {
        console.error("Guacamole client error:", e);
        setStatus(`ERROR: ${e?.message || "CLIENT_ERROR"}`);

        // nếu lỗi client ngay từ đầu và còn candidate -> thử candidate kế
        const nextIndex = wsIndexRef.current + 1;
        if (nextIndex < wsCandidates.length && stateRef.current !== 3) {
          setStatus(`FALLBACK WS -> ${wsCandidates[nextIndex]}`);
          hardCleanup();
          connectWithIndex(nextIndex);
          return;
        }

        scheduleReconnect("CLIENT_ERROR");
      };

      // ----- connect params
      const { w, h, dpi } = getBoxSize();
      lastSizeRef.current = { w, h, dpi };

      const params = new URLSearchParams({
        token,
        width: String(w),
        height: String(h),
        dpi: String(dpi),
      });

      try {
        client.connect(params.toString());
      } catch (err) {
        console.error("Connect failed:", err);
        scheduleReconnect("CONNECT_THROW");
      }

      // ----- cleanup for this connect
      cleanupRef.current = () => {
        try {
          if (resizeTimer) clearTimeout(resizeTimer);
        } catch {}

        try {
          ro.disconnect();
        } catch {}

        try {
          window.removeEventListener("resize", onWindowResize);
        } catch {}

        try {
          displayEl.removeEventListener("click", focusDisplay);
        } catch {}

        try {
          keyboard.onkeydown = null;
          keyboard.onkeyup = null;
        } catch {}

        try {
          client.disconnect();
        } catch {}

        try {
          if (displayMountRef.current) displayMountRef.current.innerHTML = "";
        } catch {}
      };
    };

    // --- main effect logic
    if (!token) {
      setStatus("NO_TOKEN");
      setStateNum(5);
      stateRef.current = 5;
      hardCleanup();
      return () => {};
    }

    // reset candidate index mỗi lần token đổi (token mới -> thử primary trước)
    wsIndexRef.current = 0;

    // connect initial
    connectWithIndex(0);

    return () => {
      alive = false;
      hardCleanup();
    };
  }, [token, wsCandidates]);

  return (
    <div ref={containerRef} className="w-full h-full bg-black relative overflow-hidden">
      {!isConnected && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 text-white z-50">
          <div className="text-center px-6">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white mx-auto mb-3" />
            <div className="text-sm font-medium">{status}</div>
            <div className="text-xs text-gray-300 mt-1">
              {token ? "Click vào màn hình sau khi kết nối để bắt phím." : "Chưa có token."}
            </div>
          </div>
        </div>
      )}

      <div ref={displayMountRef} className="w-full h-full bg-black" />
    </div>
  );
}
