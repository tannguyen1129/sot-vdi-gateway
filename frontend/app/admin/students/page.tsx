"use client";

import { useState, useEffect, useMemo } from 'react';
import api from './../../utils/axios';

// --- INTERFACES ---
interface Student {
  id: number;
  username: string;
  fullName: string;
  className: string;
  department: string;
  role: string;
  isActive: boolean;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- 1. Fetch Data ---
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      const studentList = Array.isArray(res.data) 
        ? res.data.filter((u: any) => u.role === 'STUDENT' || !u.role || u.role === 'student') 
        : []; 
      setStudents(studentList);
    } catch (err) {
      console.error("Lỗi tải danh sách:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  // --- 2. Filter & Pagination ---
  const filteredData = useMemo(() => {
    return students.filter(st => 
        (st.username?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
        (st.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (st.department?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
  );

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  // --- 3. Import ---
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
      setMessage({ type: 'success', text: res.data.message || 'Import dữ liệu thành công.' });
      fetchStudents();
      setFile(null);
      (document.getElementById('fileInput') as HTMLInputElement).value = '';
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Lỗi import file. Kiểm tra định dạng.';
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
            
            {/* Import Box */}
            <div className="flex items-center gap-2 bg-white p-2 border border-slate-200 shadow-sm rounded-lg">
                <input 
                    id="fileInput"
                    type="file" accept=".xlsx, .csv"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
                <button 
                    onClick={handleImport}
                    disabled={importing || !file}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors rounded shadow-sm"
                >
                    {importing ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Đang Xử Lý...
                        </span>
                    ) : 'Import Excel'}
                </button>
            </div>
        </div>

        {/* --- MESSAGE ALERT (ĐÃ SỬA SVG) --- */}
        {message && (
            <div className={`mb-6 p-4 border-l-4 flex items-center gap-3 rounded shadow-sm animate-in slide-in-from-top-2 ${
                message.type === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-red-50 border-red-500 text-red-700'
            }`}>
                {/* Icon Success */}
                {message.type === 'success' && (
                    <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )}
                {/* Icon Error */}
                {message.type === 'error' && (
                    <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                )}
                <span className="font-medium text-sm">{message.text}</span>
                <button onClick={() => setMessage(null)} className="ml-auto hover:bg-black/5 p-1 rounded">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        )}

        {/* --- TOOLBAR --- */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <div className="relative w-full md:w-96 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 bg-white text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium rounded shadow-sm"
                    placeholder="Tìm kiếm MSSV, Tên hoặc Khoa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <span>Hiển thị:</span>
                <select 
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="border border-slate-300 bg-white py-1 px-2 focus:outline-none focus:border-blue-500 cursor-pointer rounded shadow-sm"
                >
                    <option value={10}>10 dòng</option>
                    <option value={20}>20 dòng</option>
                    <option value={50}>50 dòng</option>
                    <option value={100}>100 dòng</option>
                </select>
            </div>
        </div>

        {/* --- DATA TABLE --- */}
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden mb-6 rounded-lg">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                            <th className="p-4 w-16 text-center">STT</th>
                            <th className="p-4 w-40">MSSV / Username</th>
                            <th className="p-4">Họ và Tên</th>
                            <th className="p-4 text-blue-600">Khoa / Trường</th>
                            <th className="p-4 w-32">Lớp / Khóa</th>
                            <th className="p-4 w-32 text-center">Trạng Thái</th>
                            <th className="p-4 w-24 text-right">Tác Vụ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {loading ? (
                            <tr><td colSpan={7} className="p-8 text-center text-slate-400 italic">Đang tải dữ liệu...</td></tr>
                        ) : paginatedData.length > 0 ? (
                            paginatedData.map((st, idx) => (
                                <tr key={st.id} className="hover:bg-blue-50/50 transition-colors group">
                                    <td className="p-4 text-center text-slate-400 font-mono text-xs">
                                        {(currentPage - 1) * itemsPerPage + idx + 1}
                                    </td>
                                    <td className="p-4">
                                        <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-1 border border-blue-100 text-xs rounded">
                                            {st.username}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold text-slate-700 group-hover:text-blue-800 transition-colors">
                                        {st.fullName}
                                    </td>
                                    <td className="p-4 text-slate-600">
                                        {st.department ? (
                                            <span className="flex items-center gap-1.5">
                                                <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                                {st.department}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 italic text-xs">--</span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs font-semibold text-slate-500 border border-slate-200 px-2 py-0.5 bg-slate-50 uppercase rounded">
                                            {st.className || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        {st.isActive ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-600 border border-emerald-200">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
                                                Active
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-red-50 text-red-600 border border-red-200">
                                                Locked
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Chỉnh sửa">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </button>
                                            <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Xóa">
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="p-12 text-center flex flex-col items-center justify-center text-slate-400">
                                    <svg className="w-12 h-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                    <span className="text-sm font-medium">Không tìm thấy dữ liệu.</span>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
                 <span>Đang hiển thị {paginatedData.length} trên tổng số {filteredData.length} kết quả</span>
            </div>
        </div>

        {/* --- PAGINATION --- */}
        {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2">
                <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-sm font-bold text-slate-600 rounded shadow-sm"
                >
                    &laquo; Trước
                </button>
                <span className="text-sm font-medium text-slate-600 mx-2">Trang {currentPage} / {totalPages}</span>
                <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-sm font-bold text-slate-600 rounded shadow-sm"
                >
                    Sau &raquo;
                </button>
            </div>
        )}
      </div>
    </div>
  );
}