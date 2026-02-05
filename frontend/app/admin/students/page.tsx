"use client";
import { useState, useEffect, useMemo } from 'react';
import api from './../../utils/axios';

// --- INTERFACES ---
interface Student {
  id: number;
  username: string; // MSSV
  fullName: string;
  className: string;
  role: string;
  isActive: boolean;
}

export default function StudentsPage() {
  // Data States
  const [students, setStudents] = useState<Student[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- 1. Fetch Data ---
  const fetchStudents = async () => {
    setLoading(true);
    try {
      // Chỉ lấy User có role STUDENT (nếu API trả về cả Admin thì cần lọc)
      const res = await api.get('/admin/users');
      // Giả sử API trả về mảng user hỗn hợp, ta lọc lấy STUDENT
      // Nếu API đã lọc sẵn thì bỏ .filter
      const studentList = Array.isArray(res.data) 
        ? res.data.filter((u: any) => u.role === 'STUDENT') 
        : []; 
      setStudents(studentList);
    } catch (err) {
      console.error("Lỗi tải danh sách:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  // --- 2. Filter Logic (Client-side) ---
  const filteredData = useMemo(() => {
    return students.filter(st => 
        st.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
        st.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  // --- 3. Pagination Logic ---
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
  );

  // Reset về trang 1 khi search thay đổi
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  // --- 4. Import Handler ---
  const handleImport = async () => {
    if (!file) return alert("Vui lòng chọn file!");
    if (!file.name.match(/\.(xlsx|csv)$/)) return alert("Chỉ chấp nhận file .xlsx hoặc .csv!");

    setImporting(true);
    setMessage(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/admin/import-users', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage({ type: 'success', text: `Import thành công! ${res.data.message || ''}` });
      fetchStudents();
      setFile(null);
      // Reset input file bằng cách query DOM (mẹo nhỏ) hoặc dùng ref
      (document.getElementById('fileInput') as HTMLInputElement).value = '';
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Lỗi import file. Vui lòng kiểm tra định dạng.';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-800">
      
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 pb-6 border-b border-slate-200 gap-4">
            <div>
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                    <span className="w-2 h-8 bg-blue-600 block"></span>
                    Quản Lý Sinh Viên
                </h1>
                <p className="text-slate-500 mt-1 pl-5 text-sm font-medium">
                    Tổng số: <span className="font-bold text-blue-600">{students.length}</span> hồ sơ
                </p>
            </div>
            
            {/* Import Box Mini */}
            <div className="flex items-center gap-2 bg-white p-2 border border-slate-200 shadow-sm">
                <input 
                    id="fileInput"
                    type="file" accept=".xlsx, .csv"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
                <button 
                    onClick={handleImport}
                    disabled={importing || !file}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                    {importing ? 'Đang Xử Lý...' : 'Import Excel'}
                </button>
            </div>
        </div>

        {/* --- MESSAGE ALERT --- */}
        {message && (
            <div className={`mb-6 p-4 border-l-4 flex items-center gap-3 ${
                message.type === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-red-50 border-red-500 text-red-700'
            }`}>
                <span className="text-xl">{message.type === 'success' ? '✅' : '⚠️'}</span>
                <span className="font-medium text-sm">{message.text}</span>
            </div>
        )}

        {/* --- TOOLBAR (SEARCH & PAGINATION SIZE) --- */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            {/* Search Bar */}
            <div className="relative w-full md:w-96 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 bg-white text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                    placeholder="Tìm kiếm theo MSSV hoặc Tên..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Pagination Size Selector */}
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <span>Hiển thị:</span>
                <select 
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="border border-slate-300 bg-white py-1 px-2 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                    <option value={10}>10 dòng</option>
                    <option value={20}>20 dòng</option>
                    <option value={50}>50 dòng</option>
                    <option value={100}>100 dòng</option>
                </select>
            </div>
        </div>

        {/* --- DATA TABLE --- */}
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                            <th className="p-4 w-16 text-center">STT</th>
                            <th className="p-4 w-48">MSSV / Username</th>
                            <th className="p-4">Họ và Tên</th>
                            <th className="p-4 w-48">Lớp / Khóa</th>
                            <th className="p-4 w-32 text-center">Trạng Thái</th>
                            <th className="p-4 w-24 text-right">Tác Vụ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-400 italic">Đang tải dữ liệu...</td></tr>
                        ) : paginatedData.length > 0 ? (
                            paginatedData.map((st, idx) => (
                                <tr key={st.id} className="hover:bg-blue-50/50 transition-colors group">
                                    <td className="p-4 text-center text-slate-400 font-mono text-xs">
                                        {(currentPage - 1) * itemsPerPage + idx + 1}
                                    </td>
                                    <td className="p-4">
                                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 border border-blue-100 text-xs">
                                            {st.username}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold text-slate-700 group-hover:text-blue-800 transition-colors">
                                        {st.fullName}
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs font-semibold text-slate-500 border border-slate-200 px-2 py-0.5 bg-slate-50 uppercase">
                                            {st.className || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="inline-flex items-center px-2 py-1 rounded-none text-[10px] font-bold uppercase bg-emerald-50 text-emerald-600 border border-emerald-200">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                                            Active
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="text-slate-400 hover:text-blue-600 transition-colors" title="Chỉnh sửa (Chưa cài đặt)">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                                    <svg className="w-12 h-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                    <span className="text-sm font-medium">Không tìm thấy sinh viên nào.</span>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Table Footer: Summary */}
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
                 <span>Đang hiển thị {paginatedData.length} trên tổng số {filteredData.length} kết quả</span>
                 {searchTerm && <span className="text-amber-600 font-medium">Đang lọc theo: "{searchTerm}"</span>}
            </div>
        </div>

        {/* --- PAGINATION CONTROLS --- */}
        {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
                <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold text-slate-600 transition-colors"
                >
                    &laquo; Trước
                </button>
                
                {/* Page Numbers */}
                <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                        // Logic hiển thị rút gọn nếu quá nhiều trang (Optional: hiện tại show all cho đơn giản)
                        if (totalPages > 10 && Math.abs(page - currentPage) > 2 && page !== 1 && page !== totalPages) {
                             if (Math.abs(page - currentPage) === 3) return <span key={page} className="px-1 text-slate-400">...</span>;
                             return null;
                        }

                        return (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-8 h-8 flex items-center justify-center border text-sm font-bold transition-all ${
                                    currentPage === page 
                                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                                        : 'bg-white border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600'
                                }`}
                            >
                                {page}
                            </button>
                        );
                    })}
                </div>

                <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold text-slate-600 transition-colors"
                >
                    Sau &raquo;
                </button>
            </div>
        )}

      </div>
    </div>
  );
}