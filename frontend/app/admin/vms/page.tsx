"use client";
import { useState, useEffect } from 'react';
import api from './../../utils/axios';

export default function VmsPage() {
  const [vms, setVms] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // State cho Edit Modal
  const [editingVm, setEditingVm] = useState<any>(null);

  // 1. Lấy danh sách
  const fetchVms = async () => {
    try {
      const res = await api.get('/admin/vms');
      setVms(res.data);
    } catch (err) { console.error(err); }
  };
  useEffect(() => { fetchVms(); }, []);

  // 2. Import Excel
  const handleImport = async () => {
    if (!file) return alert("Chưa chọn file!");
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/admin/import-vms', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMessage(`✅ ${res.data.message}`);
      fetchVms();
    } catch (err: any) {
      setMessage(`❌ Lỗi: ${err.response?.data?.message || 'Import thất bại'}`);
    } finally {
      setLoading(false);
    }
  };

  // 3. Xóa VM
  const handleDelete = async (id: number, ip: string, port: number) => {
    if (!confirm(`Bạn chắc chắn muốn xóa máy ${ip}:${port}?`)) return;
    try {
      await api.delete(`/admin/vms/${id}`);
      alert("Đã xóa thành công!");
      fetchVms(); 
    } catch (err) {
      alert("Lỗi khi xóa!");
    }
  };

  // 4. Update VM (ĐÃ SỬA: Thêm cập nhật Port)
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVm) return;
    try {
      await api.put(`/admin/vms/${editingVm.id}`, {
        ip: editingVm.ip,
        port: parseInt(editingVm.port), // Convert sang số
        username: editingVm.username,
        // password: editingVm.password 
      });
      alert("Cập nhật thành công!");
      setEditingVm(null); 
      fetchVms();
    } catch (err) {
      alert("Lỗi cập nhật!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">QUẢN LÝ MÁY ẢO (VDI POOL)</h1>

        {/* --- KHUNG IMPORT --- */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="font-bold mb-4 text-green-800">📤 Nạp danh sách máy (Excel: IP, Port, User, Pass)</h2>
            <div className="flex gap-4 items-center">
                <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="border p-2 rounded" />
                <button onClick={handleImport} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-bold">
                    {loading ? 'Đang xử lý...' : 'Upload Excel'}
                </button>
            </div>
            {message && <p className="mt-2 text-sm text-blue-600 font-bold">{message}</p>}
        </div>

        {/* --- BẢNG DANH SÁCH --- */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b">
                    <tr>
                        <th className="p-4">ID</th>
                        <th className="p-4">IP Address</th>
                        <th className="p-4">Port</th> {/* THÊM CỘT PORT */}
                        <th className="p-4">Username</th>
                        <th className="p-4">Trạng thái</th>
                        <th className="p-4 text-center">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {vms.map((vm) => (
                        <tr key={vm.id} className="border-b hover:bg-gray-50">
                            <td className="p-4 text-gray-500">#{vm.id}</td>
                            <td className="p-4 font-mono font-bold text-blue-600">{vm.ip}</td>
                            <td className="p-4 font-mono font-bold text-purple-600">{vm.port}</td> {/* HIỂN THỊ PORT */}
                            <td className="p-4">{vm.username}</td>
                            <td className="p-4">
                                {vm.isAllocated ? 
                                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-bold">Đang dùng ({vm.allocatedToUserId})</span> : 
                                    <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs font-bold">Sẵn sàng</span>
                                }
                            </td>
                            <td className="p-4 flex justify-center gap-2">
                                <button 
                                    onClick={() => setEditingVm(vm)}
                                    className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600"
                                >
                                    ✏️ Sửa
                                </button>
                                <button 
                                    onClick={() => handleDelete(vm.id, vm.ip, vm.port)}
                                    className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                                >
                                    🗑️ Xóa
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* --- MODAL EDIT --- */}
      {editingVm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                <h3 className="text-xl font-bold mb-4">Chỉnh sửa máy ảo</h3>
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">IP Address</label>
                        <input 
                            type="text" 
                            value={editingVm.ip}
                            onChange={(e) => setEditingVm({...editingVm, ip: e.target.value})}
                            className="w-full border p-2 rounded mt-1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Port (RDP)</label>
                        <input 
                            type="number" 
                            value={editingVm.port}
                            onChange={(e) => setEditingVm({...editingVm, port: e.target.value})}
                            className="w-full border p-2 rounded mt-1"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Username</label>
                        <input 
                            type="text" 
                            value={editingVm.username}
                            onChange={(e) => setEditingVm({...editingVm, username: e.target.value})}
                            className="w-full border p-2 rounded mt-1"
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setEditingVm(null)} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400">Hủy</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Lưu thay đổi</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}