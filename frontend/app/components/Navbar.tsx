"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();

  // --- LOGIC AUTH ---
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
    updateUser();
    
    const handleAuthChange = () => updateUser();
    window.addEventListener('auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-change'));
    router.push('/login');
  };

  const isStudentExamPage = pathname.includes('/exam/') && !pathname.startsWith('/admin');
  const isVdiPage = pathname.includes('/vdi');

  // Ẩn Navbar khi đang thi
  if (isStudentExamPage || isVdiPage) return null;
  
  if (!mounted) return <div className="h-16 bg-white border-b border-gray-200"></div>;

  // --- MENU DATA (CẬP NHẬT THÊM /GUIDE) ---
  const adminMenu = [
    { name: 'DASHBOARD', href: '/admin' },
    { name: 'KỲ THI', href: '/admin/exams' },
    { name: 'GIÁM SÁT', href: '/admin/monitor' },
    { name: 'SINH VIÊN', href: '/admin/students' },
    { name: 'MÁY ẢO', href: '/admin/vms' },
    { name: 'HƯỚNG DẪN', href: '/guide' }, // [MỚI]
  ];
  const studentMenu = [
    { name: 'TRANG CHỦ', href: '/' },
    { name: 'KỲ THI', href: '/dashboard' },
    { name: 'HƯỚNG DẪN', href: '/guide' }, // [MỚI]
  ];
  const guestMenu = [
    { name: 'TRANG CHỦ', href: '/' },
    { name: 'GIỚI THIỆU', href: '/#about' }, // Hash link cho trang chủ
    { name: 'HƯỚNG DẪN', href: '/guide' }, // [MỚI]
  ];

  let currentMenu = guestMenu;
  if (user) {
    const role = user.role ? user.role.toUpperCase() : '';
    if (role === 'ADMIN') currentMenu = adminMenu;
    else if (role === 'STUDENT') currentMenu = studentMenu;
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 text-gray-800 font-sans shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* ================= LEFT: LOGOS ================= */}
          <Link href="/" className="flex items-center gap-4 group select-none transition-opacity hover:opacity-80">
            <div className="relative h-10 w-auto flex-shrink-0">
               <img src="/sot-xanh.png" alt="SOT" className="h-full w-auto object-contain" onError={(e) => e.currentTarget.style.display='none'} />
            </div>
            <div className="h-8 w-[1px] bg-gray-300 hidden sm:block"></div>
            <div className="relative h-9 w-auto flex-shrink-0">
               <img src="/sot-vdi.png" alt="SOT VDI" className="h-full w-auto object-contain" onError={(e) => e.currentTarget.style.display='none'} />
            </div>
          </Link>

          {/* ================= CENTER: DESKTOP MENU ================= */}
          <div className="hidden md:flex items-center h-full space-x-1">
            {currentMenu.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.name} 
                  href={item.href}
                  className={`h-16 flex items-center px-4 text-sm font-bold tracking-wide transition-all duration-200 border-b-[3px]
                    ${isActive 
                      ? 'border-blue-600 text-blue-700 bg-blue-50/50'  // Active
                      : 'border-transparent text-gray-500 hover:text-blue-600 hover:bg-gray-50' // Inactive
                    }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* ================= RIGHT: USER INFO ================= */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4 pl-4 border-l border-gray-300">
                <div className="text-right leading-tight">
                  <div className="text-sm font-bold text-gray-900 max-w-[150px] truncate" title={user.fullName || user.username}>
                    {user.fullName || user.username}
                  </div>
                  <div className="flex justify-end mt-0.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      user.role === 'ADMIN' 
                        ? 'border-red-200 text-red-600 bg-red-50' 
                        : 'border-blue-200 text-blue-600 bg-blue-50'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="p-2 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="square" strokeLinejoin="miter" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                </button>
              </div>
            ) : (
              pathname !== '/login' && (
                <Link 
                  href="/login" 
                  className="px-6 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md hover:shadow-lg rounded-md flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                  ĐĂNG NHẬP
                </Link>
              )
            )}
          </div>

          {/* ================= MOBILE HAMBURGER ================= */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors bg-gray-100 rounded-md"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ================= MOBILE MENU ================= */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white shadow-xl absolute w-full left-0 animate-in slide-in-from-top-2">
          <div className="flex flex-col py-2">
            {currentMenu.map((item) => {
               const isActive = pathname === item.href;
               return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-6 py-3 text-sm font-bold border-l-4 transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-700 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </div>
          
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-base font-bold text-gray-900">{user.fullName || user.username}</div>
                  <div className="text-xs font-semibold text-gray-500 uppercase">{user.role}</div>
                </div>
                <button onClick={handleLogout} className="text-sm font-bold text-red-600 hover:text-red-800 bg-red-100 px-3 py-2 rounded">
                  ĐĂNG XUẤT
                </button>
              </div>
            ) : (
              pathname !== '/login' && (
                <Link href="/login" className="block w-full text-center px-5 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow">
                  ĐĂNG NHẬP NGAY
                </Link>
              )
            )}
          </div>
        </div>
      )}
    </nav>
  );
}