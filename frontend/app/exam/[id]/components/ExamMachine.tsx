"use client";
import GuacamoleDisplay from '../../../components/GuacamoleDisplay';

interface MachineProps {
    examName: string;
    token: string;
    onExit: () => void;
}

export default function ExamMachine({ examName, token, onExit }: MachineProps) {
    return (
        <div className="fixed inset-0 bg-black flex flex-col z-50">
            {/* Top Bar Overlay */}
            <div className="h-10 bg-[#1a1a1a] flex items-center justify-between px-4 border-b border-gray-700 select-none">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-gray-300 text-sm font-medium">{examName}</span>
                    <span className="text-xs text-gray-600 px-2 py-0.5 bg-gray-800 rounded border border-gray-700">Windows 10 RDP</span>
                </div>

                <button 
                    onClick={onExit}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-1.5 rounded font-bold transition"
                >
                    NỘP BÀI & THOÁT
                </button>
            </div>

            {/* RDP Area */}
            <div className="flex-1 relative bg-black">
                {/* Chỉ render Guacamole khi đã có Token, đảm bảo logic tách biệt */}
                <GuacamoleDisplay token={token} />
            </div>
        </div>
    );
}