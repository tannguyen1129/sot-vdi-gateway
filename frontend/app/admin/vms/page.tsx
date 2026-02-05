"use client";
import { useState, useEffect, useMemo } from 'react';
import api from './../../utils/axios';

// --- INTERFACES ---
interface VM {
  id: number;
  ip: string;
  port: number;
  username: string;
  isAllocated: boolean;
  allocatedToUserId?: number; // ID sinh viên đang dùng (nếu có)
}

export default function VmsPage() {
  // Data States
  const [vms, setVms] = useState<VM[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [editingVm, setEditingVm] = useState<VM | null>(null);

  // Filter & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // --- 1. Fetch Data ---
  const fetchVms = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/vms');
      setVms(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVms(); }, []);

  // --- 2. Filter & Pagination Logic ---
  const filteredData = useMemo(() => {
    return vms.filter(vm => 
        vm.ip.includes(searchTerm) || 
        vm.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vms, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
  );

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  // --- 3. Actions ---
  const handleImport = async () => {
    if (!file) return alert("Chưa chọn file!");
    setImporting(true);
    setMessage(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/admin/import-vms', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage({ type: 'success', text: `Import thành công! ${res.data.message}` });
      fetchVms();
      setFile(null);
      (document.getElementById('fileInput') as HTMLInputElement).value = '';
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Lỗi Import' });
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: number, ip: string, port: number) => {
    if (!confirm(`XÓA MÁY ẢO: ${ip}:${port}?\nHành động này không thể hoàn tác.`)) return;
    try {
      await api.delete(`/admin/vms/${id}`);
      fetchVms();
      setMessage({ type: 'success', text: 'Đã xóa máy ảo khỏi hệ thống.' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Không thể xóa máy ảo này.' });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVm) return;
    try {
      await api.put(`/admin/vms/${editingVm.id}`, {
        ip: editingVm.ip,
        port: Number(editingVm.port),
        username: editingVm.username,
      });
      setMessage({ type: 'success', text: 'Cập nhật thông tin thành công.' });
      setEditingVm(null);
      fetchVms();
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi cập nhật thông tin.' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-800 relative">
      
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 pb-6 border-b border-slate-200 gap-4">
            <div>
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
                    <span className="w-2 h-8 bg-indigo-600 block"></span>
                    Quản Lý Hạ Tầng VDI
                </h1>
                <p className="text-slate-500 mt-1 pl-5 text-sm font-medium">
                    Tổng số máy: <span className="font-bold text-indigo-600">{vms.length}</span> | Khả dụng: <span className="font-bold text-emerald-600">{vms.filter(v => !v.isAllocated).length}</span>
                </p>
            </div>
            
            {/* Import Box */}
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
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors"
                >
                    {importing ? 'Đang Nạp...' : 'Nạp Pool'}
                </button>
            </div>
        </div>

        {/* --- MESSAGE ALERT --- */}
        {message && (
            <div className={`mb-6 p-4 border-l-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
                message.type === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-red-50 border-red-500 text-red-700'
            }`}>
                <span className="text-xl">{message.type === 'success' ? '✅' : '⚠️'}</span>
                <span className="font-medium text-sm">{message.text}</span>
                <button onClick={() => setMessage(null)} className="ml-auto text-xs font-bold hover:underline">ĐÓNG</button>
            </div>
        )}

        {/* --- TOOLBAR --- */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
            <div className="relative w-full md:w-96 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 bg-white text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono font-medium"
                    placeholder="Tìm kiếm IP..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
             <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <span>Hiển thị:</span>
                <select 
                    value={itemsPerPage}
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="border border-slate-300 bg-white py-1 px-2 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                    <option value={10}>10 máy</option>
                    <option value={20}>20 máy</option>
                    <option value={50}>50 máy</option>
                </select>
            </div>
        </div>

        {/* --- DATA TABLE --- */}
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden mb-6">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                            <th className="p-4 w-20 text-center">ID</th>
                            <th className="p-4 w-48 font-mono">Địa Chỉ IP</th>
                            <th className="p-4 w-32 font-mono">Port (RDP)</th>
                            <th className="p-4">Tài Khoản VM</th>
                            <th className="p-4 w-48 text-center">Trạng Thái</th>
                            <th className="p-4 w-32 text-right">Tác Vụ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                             <tr><td colSpan={6} className="p-8 text-center text-slate-400 italic">Đang tải dữ liệu...</td></tr>
                        ) : paginatedData.length > 0 ? (
                            paginatedData.map((vm) => (
                                <tr key={vm.id} className="hover:bg-indigo-50/30 transition-colors group">
                                    <td className="p-4 text-center text-slate-400 font-mono text-xs">#{vm.id}</td>
                                    
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                                            <span className="font-mono font-bold text-slate-700">{vm.ip}</span>
                                        </div>
                                    </td>

                                    <td className="p-4">
                                        <span className="font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 border border-slate-200 text-xs">
                                            {vm.port}
                                        </span>
                                    </td>

                                    <td className="p-4 font-medium text-slate-600">
                                        {vm.username}
                                    </td>

                                    <td className="p-4 text-center">
                                        {vm.isAllocated ? (
                                            <span className="inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase bg-rose-50 text-rose-600 border border-rose-200">
                                                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                Đã Cấp (UID: {vm.allocatedToUserId})
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 text-[10px] font-bold uppercase bg-emerald-50 text-emerald-600 border border-emerald-200">
                                                <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                Sẵn Sàng
                                            </span>
                                        )}
                                    </td>

                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => setEditingVm(vm)}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all"
                                                title="Sửa cấu hình"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(vm.id, vm.ip, vm.port)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                                                title="Xóa máy"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={6} className="p-12 text-center text-slate-400 italic">Không tìm thấy máy ảo nào.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
             {/* Pagination Controls */}
             {totalPages > 1 && (
                <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-center items-center gap-2">
                    <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-xs font-bold text-slate-600"
                    >
                        Prev
                    </button>
                    <span className="text-xs font-medium text-slate-500">Page {currentPage} / {totalPages}</span>
                    <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 text-xs font-bold text-slate-600"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>

      </div>

      {/* --- MODAL EDIT (Technical Style) --- */}
      {editingVm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setEditingVm(null)}></div>
             <div className="relative bg-white w-full max-w-md shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
                <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center border-b border-slate-700">
                   <h2 className="text-sm font-bold uppercase tracking-wide">Cấu Hình Máy Ảo #{editingVm.id}</h2>
                   <button onClick={() => setEditingVm(null)} className="text-slate-400 hover:text-white">&times;</button>
                </div>
                
                <form onSubmit={handleUpdate} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">IP Address</label>
                        <input 
                            type="text" required
                            value={editingVm.ip}
                            onChange={(e) => setEditingVm({...editingVm, ip: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-300 p-2 text-slate-800 font-mono focus:border-indigo-600 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Port (RDP)</label>
                        <input 
                            type="number" required
                            value={editingVm.port}
                            onChange={(e) => setEditingVm({...editingVm, port: Number(e.target.value)})}
                            className="w-full bg-slate-50 border border-slate-300 p-2 text-slate-800 font-mono focus:border-indigo-600 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username (OS)</label>
                        <input 
                            type="text" required
                            value={editingVm.username}
                            onChange={(e) => setEditingVm({...editingVm, username: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-300 p-2 text-slate-800 focus:border-indigo-600 outline-none"
                        />
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                        <button type="button" onClick={() => setEditingVm(null)} className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 uppercase">Hủy</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase shadow">Lưu Cấu Hình</button>
                    </div>
                </form>
             </div>
        </div>
      )}
    </div>
  );
}