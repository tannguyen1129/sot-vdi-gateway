"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from './../utils/axios';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/auth/login', { username, password });
      localStorage.setItem('user', JSON.stringify(res.data));
      window.dispatchEvent(new Event('auth-change'));

      if (res.data.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative font-sans text-slate-800">
      
      {/* --- BACKGROUND GRID PATTERN --- */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      {/* --- LOGIN CARD --- */}
      <div className="w-full max-w-md bg-white border-t-4 border-blue-600 shadow-2xl shadow-slate-200 relative z-10 animate-in fade-in zoom-in duration-300">
        
        {/* Header Section */}
        <div className="p-8 pb-0 text-center">
           {/* LOGO DUY NHẤT - CĂN GIỮA */}
           <div className="flex justify-center mb-8">
              <img 
                src="/sot-vdi.png" 
                alt="SOT VDI" 
                className="h-14 w-auto object-contain drop-shadow-sm" 
              />
           </div>
           
           <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Cổng Đăng Nhập</h1>
           <p className="text-slate-500 text-sm mt-2 font-medium">Hệ thống thi thực hành & VDI Gateway</p>
        </div>

        {/* Form Section */}
        <div className="p-8 pt-6">
          
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 flex items-start gap-3">
               <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               <span className="text-sm text-red-700 font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            
            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tài khoản (MSSV)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-0 transition-all font-medium"
                  placeholder="Nhập mã số sinh viên..."
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mật khẩu</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-300 bg-slate-50 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-0 transition-all font-medium"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 mt-6 font-bold text-sm uppercase tracking-widest text-white transition-all duration-200 transform active:scale-[0.98]
                ${loading 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-blue-700 hover:bg-blue-800 shadow-lg shadow-blue-700/20'
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                   <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   Đang Xác Thực...
                </span>
              ) : 'Đăng Nhập Hệ Thống'}
            </button>

          </form>
        </div>

        {/* Footer Link */}
        <div className="bg-slate-50 p-4 text-center border-t border-slate-200">
           <Link href="/" className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-1 group">
              <svg className="w-3 h-3 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Quay lại Trang chủ
           </Link>
        </div>

      </div>
      
      {/* Footer Info */}
      <div className="absolute bottom-6 text-center w-full text-slate-400 text-xs font-medium">
         &copy; 2026 SOT VDI Gateways. Powered by TechGen Team.
      </div>

    </div>
  );
}