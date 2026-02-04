"use client";
import { useState } from 'react';

interface LobbyProps {
    exam: any;
    user: any;
    onJoin: (accessCode: string) => void;
    loading: boolean;
    error: string;
}

export default function ExamLobby({ exam, user, onJoin, loading, error }: LobbyProps) {
    const [code, setCode] = useState('');

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-xl w-full rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                {/* Header */}
                <div className="bg-blue-700 p-8 text-white text-center">
                    <h1 className="text-2xl font-bold uppercase tracking-wider mb-2">{exam?.name}</h1>
                    <p className="opacity-80 text-sm">Xin chào, {user?.fullName}</p>
                </div>

                <div className="p-8 space-y-6">
                    {/* Thông tin giờ */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-xl text-center border">
                            <p className="text-gray-400 text-xs font-bold uppercase">Bắt đầu</p>
                            <p className="text-gray-800 font-bold">
                                {exam?.startTime ? new Date(exam.startTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                            </p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl text-center border">
                            <p className="text-gray-400 text-xs font-bold uppercase">Kết thúc</p>
                            <p className="text-gray-800 font-bold">
                                {exam?.endTime ? new Date(exam.endTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                            </p>
                        </div>
                    </div>

                    {/* Input Access Code */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Mã truy cập (Access Code)</label>
                        <input 
                            type="password"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none transition"
                            placeholder="Nhập mã do giám thị cung cấp..."
                        />
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-100 text-red-600 rounded-lg text-sm text-center font-medium">
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Button */}
                    <button 
                        onClick={() => onJoin(code)}
                        disabled={loading}
                        className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition transform active:scale-95
                            ${loading ? 'bg-gray-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {loading ? 'Đang kết nối máy chủ...' : 'VÀO PHÒNG THI'}
                    </button>
                </div>
            </div>
        </div>
    );
}