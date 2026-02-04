"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "./../../utils/axios";

import ExamLobby from "./components/ExamLobby";
import ExamMachine from "./components/ExamMachine";

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();

  // id có thể là string | string[]
  const examId = useMemo(() => {
    const raw = (params as any)?.id;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const [user, setUser] = useState<any>(null);
  const [exam, setExam] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isReady, setIsReady] = useState(false);

  // 1) Load user + exam
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        const userStr = localStorage.getItem("user");
        if (!userStr) {
          router.push("/login");
          return;
        }

        const localUser = JSON.parse(userStr);
        if (!cancelled) setUser(localUser);

        if (!examId) {
          router.push("/dashboard");
          return;
        }

        const res = await api.get(`/exams/${examId}`);
        if (!cancelled) {
          setExam(res.data);
          setIsReady(true);
        }
      } catch (err) {
        alert("Không tìm thấy kỳ thi!");
        router.push("/dashboard");
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
      // dọn fullscreen nếu user back giữa chừng
      try {
        if (document.fullscreenElement) document.exitFullscreen();
      } catch {}
    };
  }, [examId, router]);

  // 2) Join
  const handleJoin = async (accessCode: string) => {
    if (!user?.id) {
      setErrorMsg("Thông tin người dùng chưa sẵn sàng, vui lòng thử lại.");
      return;
    }
    if (!examId) {
      setErrorMsg("Không tìm thấy ID kỳ thi.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await api.post(`/exams/${examId}/join`, {
        userId: user.id,
        accessCode,
      });

      if (res.data?.connectionToken) {
        setToken(res.data.connectionToken);

        // yêu cầu fullscreen (có thể bị chặn nếu không do user gesture)
        try {
          await document.documentElement.requestFullscreen();
        } catch (e) {
          console.log("Fullscreen denied");
        }
      } else {
        setErrorMsg("Không nhận được token kết nối.");
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Lỗi kết nối máy chủ thi.");
    } finally {
      setLoading(false);
    }
  };

  // 3) Exit
  const handleExit = async () => {
    if (!user?.id) return;

    if (!confirm("Bạn có chắc chắn muốn thoát? Máy ảo sẽ bị tắt.")) return;

    try {
      await api.post("/exams/leave", { userId: user.id });
    } catch (err) {
      console.error(err);
    } finally {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
      } catch {}
      router.push("/dashboard");
    }
  };

  if (!isReady) {
    return (
      <div className="h-screen bg-gray-50 flex items-center justify-center">
        Đang tải dữ liệu...
      </div>
    );
  }

  // ✅ Có token -> ép full-screen “thật” để GuacamoleDisplay không bao giờ height=0
  if (token) {
    return (
      <div className="fixed inset-0 w-screen h-screen bg-black">
        {/* key để remount sạch khi token đổi */}
        <ExamMachine key={token} examName={exam?.name} token={token} onExit={handleExit} />
      </div>
    );
  }

  // Chưa có token -> Lobby
  return (
    <div className="min-h-screen">
      <ExamLobby
        exam={exam}
        user={user}
        onJoin={handleJoin}
        loading={loading}
        error={errorMsg}
      />
    </div>
  );
}
