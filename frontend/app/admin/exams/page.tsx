"use client";

import { useEffect, useState } from "react";
import axios from './../../utils/axios';

// --- DEFINITIONS ---
interface ExamForm {
  name: string;
  description: string;
  accessCode: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function ExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Toast State (Thông báo đẹp)
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });

  // Form State
  const [formData, setFormData] = useState<ExamForm>({
    name: '', description: '', accessCode: '', startTime: '', endTime: '', isActive: true
  });

  // --- HELPER: TOAST NOTIFICATION ---
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000); // Tự tắt sau 3s
  };

  // --- HELPER: DATE FORMATTING ---
  const formatDateForInput = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    return localDate.toISOString().slice(0, 16);
  };

  const formatDisplayDate = (isoString: string) => {
    if (!isoString) return '---';
    return new Date(isoString).toLocaleString('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  // --- API ACTIONS ---
  const fetchExams = async () => {
    try {
      const res = await axios.get('/exams');
      setExams(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchExams(); }, []);

  const openModal = (exam?: any) => {
    if (exam) {
      setEditingId(exam.id);
      setFormData({
        name: exam.name,
        description: exam.description || '',
        accessCode: exam.accessCode || '',
        startTime: exam.startTime ? formatDateForInput(exam.startTime) : '',
        endTime: exam.endTime ? formatDateForInput(exam.endTime) : '',
        isActive: exam.isActive
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', description: '', accessCode: '', startTime: '', endTime: '', isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      startTime: new Date(formData.startTime).toISOString(),
      endTime: new Date(formData.endTime).toISOString(),
    };

    try {
      if (editingId) {
        await axios.patch(`/exams/${editingId}`, payload);
        showToast("Cập nhật kỳ thi thành công!", "success");
      } else {
        await axios.post('/exams', payload);
        showToast("Khởi tạo kỳ thi mới thành công!", "success");
      }
      setIsModalOpen(false);
      fetchExams();
    } catch (err) {
      console.error(err);
      showToast("Có lỗi xảy ra. Vui lòng kiểm tra lại!", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn kỳ thi và dữ liệu liên quan. Tiếp tục?")) return;
    try {
      await axios.delete(`/exams/${id}`);
      showToast("Đã xóa kỳ thi.", "info");
      fetchExams();
    } catch (err) {
      showToast("Không thể xóa kỳ thi này!", "error");
    }
  };

  const toggleStatus = async (exam: any) => {
    try {
      await axios.patch(`/exams/${exam.id}`, { isActive: !exam.isActive });
      fetchExams();
      showToast(`Đã ${!exam.isActive ? 'KÍCH HOẠT' : 'VÔ HIỆU HÓA'} kỳ thi.`, "info");
    } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans relative">
      
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 border-b border-slate-200 pb-6">
          <div>
             <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                <span className="w-2 h-8 bg-amber-500 block"></span>
                Quản Lý Kỳ Thi
             </h1>
             <p className="text-slate-500 mt-1 pl-5 text-sm font-medium">Thiết lập lịch thi, mã truy cập và trạng thái.</p>
          </div>
          <button 
            onClick={() => openModal()}
            className="group relative bg-slate-900 hover:bg-amber-600 text-white px-6 py-3 font-bold uppercase text-sm tracking-wider transition-all duration-200 shadow-lg shadow-slate-900/20 hover:shadow-amber-600/20 flex items-center gap-2"
          >
            <span>+ Tạo Mới</span>
          </button>
        </div>

        {/* --- TABLE --- */}
        <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="p-5 w-1/4">Thông tin Kỳ thi</th>
                  <th className="p-5 w-1/4">Thời gian (Local)</th>
                  <th className="p-5 w-1/6 text-center">Mã Access</th>
                  <th className="p-5 w-1/6 text-center">Trạng thái</th>
                  <th className="p-5 w-1/6 text-right">Tác vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-5 align-top">
                      <div className="font-bold text-slate-800 text-lg leading-tight group-hover:text-blue-700 transition">
                        {exam.name}
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-1">ID: #{exam.id}</div>
                      {exam.description && (
                        <p className="text-sm text-slate-500 mt-2 line-clamp-2 border-l-2 border-slate-200 pl-2 italic">
                          {exam.description}
                        </p>
                      )}
                    </td>
                    
                    <td className="p-5 align-top">
                       <div className="space-y-3">
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Bắt đầu</div>
                            <div className="text-sm font-mono font-medium text-slate-700">
                                {formatDisplayDate(exam.startTime)}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Kết thúc</div>
                            <div className="text-sm font-mono font-medium text-slate-700">
                                {formatDisplayDate(exam.endTime)}
                            </div>
                          </div>
                       </div>
                    </td>

                    <td className="p-5 align-middle text-center">
                       {exam.accessCode ? (
                         <span className="inline-block bg-slate-100 border border-slate-200 text-slate-600 px-3 py-1 font-mono text-sm font-bold">
                           {exam.accessCode}
                         </span>
                       ) : (
                         <span className="text-slate-300 text-xs italic">Không có</span>
                       )}
                    </td>

                    <td className="p-5 align-middle text-center">
                      <button 
                        onClick={() => toggleStatus(exam)}
                        className={`inline-flex items-center px-3 py-1 text-xs font-bold uppercase tracking-wide border transition-all ${
                          exam.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                         <span className={`w-1.5 h-1.5 mr-2 rounded-full ${exam.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                         {exam.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>

                    <td className="p-5 align-middle text-right">
                       <div className="flex items-center justify-end gap-2">
                          <button 
                             onClick={() => openModal(exam)}
                             className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all"
                             title="Chỉnh sửa"
                          >
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button 
                             onClick={() => handleDelete(exam.id)}
                             className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                             title="Xóa"
                          >
                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
                
                {exams.length === 0 && (
                   <tr>
                     <td colSpan={5} className="p-12 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400">
                           <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                           <p className="text-sm font-medium">Chưa có dữ liệu kỳ thi.</p>
                        </div>
                     </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- MODAL (TECHNICAL STYLE) --- */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             {/* Backdrop */}
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
             
             {/* Modal Content */}
             <div className="relative bg-white w-full max-w-lg shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
                
                {/* Header */}
                <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center border-b border-slate-700">
                   <h2 className="text-lg font-bold uppercase tracking-wide">
                      {editingId ? 'Cập Nhật Kỳ Thi' : 'Khởi Tạo Kỳ Thi'}
                   </h2>
                   <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                   </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                   {/* Name */}
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tên Kỳ Thi <span className="text-red-500">*</span></label>
                      <input 
                         type="text" required
                         value={formData.name}
                         onChange={e => setFormData({...formData, name: e.target.value})}
                         className="w-full bg-slate-50 border border-slate-300 p-3 text-slate-800 focus:ring-0 focus:border-blue-600 focus:bg-white transition-colors outline-none font-medium"
                         placeholder="Nhập tên kỳ thi..."
                      />
                   </div>

                   {/* Description */}
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mô tả</label>
                      <textarea 
                         value={formData.description}
                         onChange={e => setFormData({...formData, description: e.target.value})}
                         className="w-full bg-slate-50 border border-slate-300 p-3 text-slate-800 focus:ring-0 focus:border-blue-600 focus:bg-white transition-colors outline-none"
                         rows={2}
                      ></textarea>
                   </div>

                   {/* Access Code */}
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mã Truy Cập</label>
                      <input 
                         type="text"
                         value={formData.accessCode}
                         onChange={e => setFormData({...formData, accessCode: e.target.value})}
                         className="w-full bg-slate-50 border border-slate-300 p-3 text-blue-700 font-mono font-bold focus:ring-0 focus:border-blue-600 focus:bg-white transition-colors outline-none"
                         placeholder="VD: SECRET_CODE_2026"
                      />
                   </div>

                   {/* Time Grid */}
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Bắt đầu</label>
                         <input 
                            type="datetime-local"
                            value={formData.startTime}
                            onChange={e => setFormData({...formData, startTime: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-300 p-2 text-sm focus:border-blue-600 outline-none"
                         />
                      </div>
                      <div>
                         <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kết thúc</label>
                         <input 
                            type="datetime-local"
                            value={formData.endTime}
                            onChange={e => setFormData({...formData, endTime: e.target.value})}
                            className="w-full bg-slate-50 border border-slate-300 p-2 text-sm focus:border-blue-600 outline-none"
                         />
                      </div>
                   </div>

                   {/* Checkbox */}
                   <div className="flex items-center gap-3 py-2">
                      <input 
                        type="checkbox" id="isActive"
                        checked={formData.isActive}
                        onChange={e => setFormData({...formData, isActive: e.target.checked})}
                        className="w-5 h-5 text-blue-600 border-slate-300 focus:ring-0 cursor-pointer"
                      />
                      <label htmlFor="isActive" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                         Kích hoạt ngay lập tức
                      </label>
                   </div>

                   {/* Footer Actions */}
                   <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-2">
                      <button 
                         type="button"
                         onClick={() => setIsModalOpen(false)}
                         className="px-5 py-2.5 text-slate-600 font-bold uppercase text-xs tracking-wider hover:bg-slate-100 transition-colors"
                      >
                         Hủy bỏ
                      </button>
                      <button 
                         type="submit"
                         disabled={loading}
                         className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-xs tracking-wider shadow-md hover:shadow-lg transition-all"
                      >
                         {loading ? 'Processing...' : 'Lưu Thay Đổi'}
                      </button>
                   </div>
                </form>
             </div>
          </div>
        )}

        {/* --- CUSTOM TOAST NOTIFICATION --- */}
        <div className={`fixed top-4 right-4 z-[100] transition-all duration-300 transform ${toast.show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
           <div className={`flex items-center gap-3 px-6 py-4 border-l-4 shadow-2xl bg-white min-w-[300px]
              ${toast.type === 'success' ? 'border-emerald-500' : ''}
              ${toast.type === 'error' ? 'border-red-500' : ''}
              ${toast.type === 'info' ? 'border-blue-500' : ''}
           `}>
              <div className={`
                 ${toast.type === 'success' ? 'text-emerald-500' : ''}
                 ${toast.type === 'error' ? 'text-red-500' : ''}
                 ${toast.type === 'info' ? 'text-blue-500' : ''}
              `}>
                 {toast.type === 'success' && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                 {toast.type === 'error' && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
                 {toast.type === 'info' && <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              </div>
              <div>
                 <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Thông báo</h4>
                 <p className="text-slate-600 text-sm">{toast.message}</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}