export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 border-t border-gray-800 mt-auto">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          
          {/* Cột 1: Thông tin bản quyền */}
          <div className="mb-4 md:mb-0 text-center md:text-left">
            <h3 className="text-white font-bold text-lg mb-1">UMT VDI PORTAL</h3>
            <p className="text-sm">Hệ thống thi thực hành trực tuyến.</p>
            <p className="text-xs mt-2">© 2026 University of Management and Technology.</p>
          </div>

          {/* Cột 2: Liên kết (Demo) */}
          <div className="flex space-x-6 text-sm">
            <a href="#" className="hover:text-blue-500 transition">Trang chủ</a>
            <a href="#" className="hover:text-blue-500 transition">Quy chế thi</a>
            <a href="#" className="hover:text-blue-500 transition">Hỗ trợ kỹ thuật</a>
          </div>
        </div>
      </div>
    </footer>
  );
}