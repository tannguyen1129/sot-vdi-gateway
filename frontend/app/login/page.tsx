"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from './../utils/axios'

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Gọi API đăng nhập
      const res = await api.post('/auth/login', { username, password })
      
      // Lưu vào LocalStorage
      localStorage.setItem('user', JSON.stringify(res.data));

      // --- THÊM DÒNG NÀY ---
      // Phát tín hiệu cho Navbar biết là đã Login thành công!
      window.dispatchEvent(new Event('auth-change'));
      // --------------------

      // Chuyển hướng
      if (res.data.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Đăng nhập thất bại. Kiểm tra lại tài khoản/mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white font-sans relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://umt.edu.vn/uploads/images/campus/campus-1.jpg')] bg-cover bg-center opacity-10 blur-sm"></div>

      <div className="w-full max-w-md p-8 bg-gray-800/90 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700 relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block">← Quay lại Trang chủ</Link>
          <h1 className="text-3xl font-bold text-white mb-2">ĐĂNG NHẬP</h1>
          <p className="text-gray-400">Cổng thi trực tuyến UMT TechGen</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-200 rounded text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Tài khoản (MSSV)</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-white placeholder-gray-500"
              placeholder="VD: SV001"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none text-white placeholder-gray-500"
              placeholder="••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 rounded font-bold transition duration-200 
              ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/30 text-white'}`}
          >
            {loading ? 'Đang xác thực...' : 'ĐĂNG NHẬP'}
          </button>
        </form>
      </div>
    </div>
  );
}