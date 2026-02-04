"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // HÀM CẬP NHẬT USER TỪ LOCALSTORAGE
  const updateUser = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    setMounted(true);
    updateUser(); // 1. Chạy lần đầu khi load trang

    // 2. Lắng nghe tín hiệu "auth-change" (Tự chế)
    const handleAuthChange = () => updateUser();
    
    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange); // Lắng nghe cả khi mở tab khác

    // Dọn dẹp khi component bị hủy
    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    // 3. Gửi tín hiệu báo đã Logout
    window.dispatchEvent(new Event('auth-change')); 
    router.push('/login');
  };

  // Ẩn Navbar khi đang trong phòng thi (để tập trung)
  const isStudentExamPage = pathname.includes('/exam') && !pathname.startsWith('/admin');
  const isVdiPage = pathname.includes('/vdi');

  if (isStudentExamPage || isVdiPage) {
    return null;
  }

  if (!mounted) return <div className="h-16 bg-gray-900"></div>;

  // --- CẤU HÌNH MENU CHUẨN ---
  const adminMenu = [
    { name: 'Trang chủ', href: '/admin' },
    { name: 'Kỳ thi', href: '/admin/exams' },
    { name: 'Giám sát', href: '/admin/monitor' },
    { name: 'Danh sách sinh viên', href: '/admin/students' },
    { name: 'Danh sách máy ảo', href: '/admin/vms' },
  ];

  const studentMenu = [
    { name: 'Trang chủ', href: '/' },
    { name: 'Kỳ thi', href: '/dashboard' }, // Vào dashboard để thấy kỳ thi
    { name: 'Giới thiệu', href: '/#about' },
    { name: 'Hướng dẫn', href: '/#guide' },
  ];

  const guestMenu = [
    { name: 'Trang chủ', href: '/' },
    { name: 'Giới thiệu', href: '/#about' },
    { name: 'Hướng dẫn', href: '/#guide' },
  ];

  // --- LOGIC CHỌN MENU (SỬA LẠI CHO CHẶT) ---
  let currentMenu = guestMenu; // Mặc định là khách
  
  if (user) {
      // Chuẩn hóa role về chữ IN HOA để so sánh cho chắc ăn
      const role = user.role ? user.role.toUpperCase() : ''; 
      
      if (role === 'ADMIN') {
          currentMenu = adminMenu;
      } else if (role === 'STUDENT') {
          currentMenu = studentMenu;
      }
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-40 shadow-lg text-white">
      <div className="container mx-auto px-6 h-16 flex justify-between items-center">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="relative w-10 h-10 bg-white rounded-full p-1 flex items-center justify-center overflow-hidden">
             <img 
                src="/logosot.png" 
                alt="SOT Logo" 
                className="object-contain w-full h-full"
                onError={(e) => { e.currentTarget.style.display = 'none'; }} 
             />
             <span className="text-blue-900 font-bold text-xs absolute opacity-0 group-hover:opacity-100 transition">SOT</span>
          </div>
          <span className="font-bold text-xl tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
            SOT VDI GATEWAYS
          </span>
        </Link>

        {/* MENU LINKS */}
        <div className="hidden md:flex space-x-6">
            {currentMenu.map((item) => (
                <Link 
                    key={item.name} 
                    href={item.href}
                    className={`text-sm font-medium transition hover:text-blue-400 
                        ${pathname === item.href ? 'text-blue-400 border-b-2 border-blue-400 pb-1' : 'text-gray-300'}`}
                >
                    {item.name}
                </Link>
            ))}
        </div>

        {/* USER INFO */}
        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-3 pl-4 border-l border-gray-700">
              <div className="text-right hidden lg:block">
                <p className="text-white font-semibold text-sm">
                  {user.fullName || user.username}
                </p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${user.role === 'ADMIN' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}>
                  {user.role === 'ADMIN' ? 'ADMIN' : 'STUDENT'}
                </span>
              </div>
              
              <button 
                onClick={handleLogout}
                className="bg-gray-800 hover:bg-red-600 text-gray-300 hover:text-white px-3 py-1.5 rounded text-xs border border-gray-700 transition"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
            pathname !== '/login' && (
              <Link 
                href="/login" 
                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-full font-medium transition shadow-lg shadow-blue-900/20 text-sm"
              >
                Đăng nhập
              </Link>
            )
          )}
        </div>
      </div>
    </nav>
  );
}