"use client";
import { useState, useEffect } from 'react';
import api from './../../utils/axios';

export default function MonitorPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>('');
  const [students, setStudents] = useState<any[]>([]);

  // 1. Load danh sách kỳ thi để Admin chọn
  useEffect(() => {
    api.get('/exams').then(res => setExams(res.data));
  }, []);

  // 2. Khi chọn kỳ thi -> Load danh sách SV đang ở trong kỳ thi đó
  useEffect(() => {
    if (selectedExam) {
        // Gọi API lấy users và lọc client-side (hoặc làm API riêng lọc server-side thì tốt hơn)
        api.get('/admin/users').then(res => {
            // Lọc những user có examId trùng với selectedExam
            const joiningStudents = res.data.filter((u: any) => u.examId === parseInt(selectedExam));
            setStudents(joiningStudents);
        });
        
        // Polling: Cứ 5s cập nhật 1 lần
        const interval = setInterval(() => {
             api.get('/admin/users').then(res => {
                const joiningStudents = res.data.filter((u: any) => u.examId === parseInt(selectedExam));
                setStudents(joiningStudents);
            });
        }, 5000);
        return () => clearInterval(interval);
    }
  }, [selectedExam]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">GIÁM SÁT PHÒNG THI (REAL-TIME)</h1>

        {/* BỘ LỌC KỲ THI */}
        <div className="bg-white p-4 rounded shadow mb-6 flex items-center space-x-4">
            <span className="font-bold text-gray-700">Chọn Kỳ thi đang diễn ra:</span>
            <select 
                className="border p-2 rounded min-w-[300px]"
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
            >
                <option value="">-- Chọn danh sách --</option>
                {exams.map(e => (
                    <option key={e.id} value={e.id}>{e.name} {e.isActive ? '(Đang mở)' : '(Đã đóng)'}</option>
                ))}
            </select>
        </div>

        {/* DANH SÁCH SINH VIÊN ĐANG THI */}
        {selectedExam && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {students.map((st) => (
                    <div key={st.id} className="bg-white p-4 rounded-lg shadow border border-green-200 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-0.5 font-bold">ONLINE</div>
                        <div className="text-center mt-2">
                            <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center font-bold text-gray-600">
                                {st.username.slice(-3)}
                            </div>
                            <p className="font-bold text-blue-900 truncate">{st.fullName}</p>
                            <p className="text-xs text-gray-500">{st.username}</p>
                            <p className="text-xs text-gray-400 mt-1">{st.className}</p>
                        </div>
                    </div>
                ))}
                
                {students.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-400 bg-white rounded border border-dashed">
                        Chưa có sinh viên nào tham gia kỳ thi này.
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
}