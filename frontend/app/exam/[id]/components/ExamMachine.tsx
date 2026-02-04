"use client";
import GuacamoleDisplay from "../../../components/GuacamoleDisplay";

interface MachineProps {
  examName: string;
  token: string;
  onExit: () => void;
}

export default function ExamMachine({ examName, token, onExit }: MachineProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top Bar */}
      <div className="h-10 shrink-0 bg-[#1a1a1a] flex items-center justify-between px-4 border-b border-gray-700 select-none">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
          <span className="text-gray-300 text-sm font-medium truncate">
            {examName}
          </span>
          <span className="text-xs text-gray-600 px-2 py-0.5 bg-gray-800 rounded border border-gray-700 shrink-0">
            Windows 10 RDP
          </span>
        </div>

        <button
          onClick={onExit}
          className="bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-1.5 rounded font-bold transition shrink-0"
        >
          NỘP BÀI &amp; THOÁT
        </button>
      </div>

      {/* RDP Area */}
      {/* ✅ min-h-0 là điểm quan trọng nhất trong flex layout */}
      <div className="flex-1 min-h-0 w-full bg-black">
        {/* ✅ wrapper full size để GuacamoleDisplay luôn có height thật */}
        <div className="w-full h-full min-h-0">
          <GuacamoleDisplay token={token} />
        </div>
      </div>
    </div>
  );
}
