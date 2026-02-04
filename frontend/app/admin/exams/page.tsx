"use client";
import { useState, useEffect } from 'react';
import axios from './../../utils/axios'; // Đảm bảo import đúng file cấu hình axios có baseURL

// Định nghĩa kiểu dữ liệu cho Exam form
interface ExamForm {
    name: string;
    description: string;
    accessCode: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
}

export default function ExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // State cho Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // State Form
  const [formData, setFormData] = useState<ExamForm>({
        name: '', description: '', accessCode: '', startTime: '', endTime: '', isActive: true
  });

  // --- HÀM HELPER: CHUYỂN UTC -> LOCAL TIME CHO INPUT ---
  // Giúp hiển thị đúng giờ VN trong ô datetime-local
  const formatDateForInput = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    // Trừ đi offset (âm) tức là cộng thêm giờ để ra giờ địa phương
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return localDate.toISOString().slice(0, 16); // Cắt lấy YYYY-MM-DDTHH:mm
  };

  // 1. Load danh sách
  const fetchExams = async () => {
    try {
      const res = await axios.get('/exams');
      setExams(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchExams(); }, []);

  // 2. Xử lý Mở Modal (Thêm mới hoặc Sửa)
  const openModal = (exam?: any) => {
      if (exam) {
          // Chế độ Sửa
          setEditingId(exam.id);
          setFormData({
              name: exam.name,
              description: exam.description || '',
              accessCode: exam.accessCode || '',
              // SỬA: Dùng hàm helper để convert giờ UTC về giờ Local cho Input
              startTime: exam.startTime ? formatDateForInput(exam.startTime) : '',
              endTime: exam.endTime ? formatDateForInput(exam.endTime) : '',
              isActive: exam.isActive
          });
      } else {
          // Chế độ Thêm mới
          setEditingId(null);
          setFormData({ name: '', description: '', accessCode: '', startTime: '', endTime: '', isActive: true });
      }
      setIsModalOpen(true);
  };

  // 3. Xử lý Submit Form (Create hoặc Update)
  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      // SỬA: Convert giờ Local (Input) sang UTC (ISO) chuẩn trước khi gửi
      const payload = {
        ...formData,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
      };

      try {
          if (editingId) {
              // Update
              await axios.patch(`/exams/${editingId}`, payload);
              alert("Cập nhật thành công!");
          } else {
              // Create
              await axios.post('/exams', payload);
              alert("Tạo kỳ thi mới thành công!");
          }
          setIsModalOpen(false);
          fetchExams();
      } catch (err) {
          console.error(err);
          alert("Có lỗi xảy ra! Vui lòng kiểm tra lại.");
      } finally {
          setLoading(false);
      }
  };

  // 4. Xử lý Xóa
  const handleDelete = async (id: number) => {
      if (!confirm("Bạn có chắc chắn muốn xóa kỳ thi này? Danh sách sinh viên gắn với kỳ thi sẽ bị hủy liên kết.")) return;
      try {
          await axios.delete(`/exams/${id}`);
          fetchExams();
      } catch (err) {
          alert("Lỗi khi xóa!");
      }
  };

  // 5. Xử lý Toggle Trạng thái nhanh
  const toggleStatus = async (exam: any) => {
      try {
          await axios.patch(`/exams/${exam.id}`, { isActive: !exam.isActive });
          fetchExams();
      } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 border-l-8 border-blue-600 pl-4">QUẢN LÝ KỲ THI</h1>
            <button 
                onClick={() => openModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2"
            >
                <span>+</span> Tạo Kỳ Thi Mới
            </button>
        </div>

        {/* DANH SÁCH KỲ THI (TABLE) */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b text-gray-600 uppercase text-xs tracking-wider">
                    <tr>
                        <th className="p-4">Tên Kỳ Thi</th>
                        <th className="p-4">Mô tả / Ghi chú</th>
                        <th className="p-4">Thời gian (VN)</th>
                        <th className="p-4 text-center">Trạng thái</th>
                        <th className="p-4 text-center">Hành động</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {exams.map((exam) => (
                        <tr key={exam.id} className="hover:bg-blue-50/30 transition">
                            <td className="p-4">
                                <p className="font-bold text-blue-900 text-lg">{exam.name}</p>
                                <span className="text-xs text-gray-400">ID: {exam.id}</span>
                            </td>
                            <td className="p-4 text-gray-600 text-sm max-w-xs">{exam.description || '-'}</td>
                            <td className="p-4 text-sm">
                                {/* Hiển thị giờ VN chuẩn */}
                                <p><span className="font-bold text-gray-500">Bắt đầu:</span> {exam.startTime ? new Date(exam.startTime).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '---'}</p>
                                <p><span className="font-bold text-gray-500">Kết thúc:</span> {exam.endTime ? new Date(exam.endTime).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : '---'}</p>
                            </td>
                            <td className="p-4 text-center">
                                <button 
                                    onClick={() => toggleStatus(exam)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold border transition ${
                                        exam.isActive 
                                        ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' 
                                        : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
                                    }`}
                                >
                                    {exam.isActive ? 'ĐANG MỞ' : 'ĐÃ ĐÓNG'}
                                </button>
                            </td>
                            <td className="p-4 text-center">
                                <div className="flex justify-center gap-2">
                                    <button 
                                        onClick={() => openModal(exam)}
                                        className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                                        title="Chỉnh sửa"
                                    >
                                        ✏️
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(exam.id)}
                                        className="p-2 text-red-600 hover:bg-red-100 rounded"
                                        title="Xóa"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {exams.length === 0 && (
                        <tr><td colSpan={5} className="p-8 text-center text-gray-400">Chưa có kỳ thi nào.</td></tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* MODAL (POPUP) FORM */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                    <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
                        <h2 className="font-bold text-lg">{editingId ? 'CẬP NHẬT KỲ THI' : 'TẠO KỲ THI MỚI'}</h2>
                        <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-gray-200 font-bold text-xl">&times;</button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tên kỳ thi <span className="text-red-500">*</span></label>
                            <input 
                                type="text" required
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="VD: Thi Giữa Kỳ CSLT 2026"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả/Ghi chú</label>
                            <textarea 
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                rows={3}
                            ></textarea>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mã truy cập (Access Code) <span className="text-gray-400 font-normal">(Để trống nếu không cần)</span>
                            </label>
                            <input 
                                type="text"
                                value={formData.accessCode}
                                onChange={e => setFormData({...formData, accessCode: e.target.value})}
                                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono text-blue-800"
                                placeholder="VD: CSLT_2026_SECURE"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian bắt đầu</label>
                                <input 
                                    type="datetime-local"
                                    value={formData.startTime}
                                    onChange={e => setFormData({...formData, startTime: e.target.value})}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian kết thúc</label>
                                <input 
                                    type="datetime-local"
                                    value={formData.endTime}
                                    onChange={e => setFormData({...formData, endTime: e.target.value})}
                                    className="w-full border p-2 rounded"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input 
                                type="checkbox" id="isActive"
                                checked={formData.isActive}
                                onChange={e => setFormData({...formData, isActive: e.target.checked})}
                                className="w-5 h-5 text-blue-600 rounded"
                            />
                            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">Kích hoạt ngay (Cho phép SV nhìn thấy)</label>
                        </div>

                        <div className="pt-4 flex justify-end gap-3 border-t mt-4">
                            <button 
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium"
                            >
                                Hủy bỏ
                            </button>
                            <button 
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold shadow"
                            >
                                {loading ? 'Đang lưu...' : 'Lưu thông tin'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}