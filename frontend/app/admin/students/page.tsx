"use client";
import { useState, useEffect } from 'react';
import api from './../../utils/axios';

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 1. Hàm lấy danh sách
  const fetchStudents = async () => {
    try {
      // 2. SỬA AXIOS -> API
      // Lưu ý: Nếu trong utils/axios.ts bạn đã để baseURL có chữ /api
      // Thì ở đây chỉ cần gọi /admin/users là đủ.
      const res = await api.get('/admin/users');
      setStudents(res.data);
    } catch (err) {
      console.error("Lỗi tải danh sách:", err);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  // 2. Hàm Import
  const handleImport = async () => {
    // 1. Kiểm tra có file chưa
    if (!file) return alert("Chưa chọn file!");
    
    // 2. Kiểm tra đuôi file (Chặn ngay từ Frontend nếu sai)
    if (!file.name.match(/\.(xlsx|csv)$/)) {
        return alert("Vui lòng chỉ chọn file Excel (.xlsx) hoặc CSV!");
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // 3. GỌI API VỚI HEADER CHUẨN DÀNH CHO FILE
      const res = await api.post('/admin/import-users', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Bắt buộc dòng này để override application/json
        },
      });
      
      setMessage(`✅ ${res.data.message || 'Import thành công!'}`);
      fetchStudents(); 
      setFile(null);   
    } catch (err: any) {
      console.error(err);
      // Hiển thị lỗi chi tiết từ Backend trả về
      const errorMsg = err.response?.data?.message || 'Lỗi Import (Kiểm tra lại format file Excel)';
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">QUẢN LÝ SINH VIÊN</h1>
            <span className="text-gray-500">Tổng số: {students.length}</span>
        </div>

        {/* KHUNG IMPORT */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="font-bold mb-4 text-blue-800">📤 Nhập dữ liệu từ Excel</h2>
            <div className="flex gap-4 items-center">
                <input 
                    type="file" accept=".xlsx, .csv"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="border p-2 rounded w-full max-w-md"
                />
                <button 
                    onClick={handleImport}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold disabled:bg-gray-400"
                >
                    {loading ? 'Đang xử lý...' : 'Upload'}
                </button>
            </div>
            {message && <p className="mt-2 text-sm font-medium text-green-600">{message}</p>}
        </div>

        {/* BẢNG DỮ LIỆU */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="p-4 font-bold text-gray-600">MSSV</th>
                        <th className="p-4 font-bold text-gray-600">Họ và tên</th>
                        <th className="p-4 font-bold text-gray-600">Lớp/Ca thi</th>
                        <th className="p-4 font-bold text-gray-600">Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map((st, idx) => (
                        <tr key={st.id} className="border-b hover:bg-gray-50">
                            <td className="p-4 font-mono text-blue-600 font-bold">{st.username}</td>
                            <td className="p-4">{st.fullName}</td>
                            <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{st.className}</span></td>
                            <td className="p-4 text-green-600 text-sm">Hoạt động</td>
                        </tr>
                    ))}
                    {students.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-gray-400">Chưa có dữ liệu sinh viên</td></tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}