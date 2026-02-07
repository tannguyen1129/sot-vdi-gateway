import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://sotvdi.umtoj.edu.vn/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      // 1. Thử lấy token trực tiếp
      let token = localStorage.getItem('accessToken');

      // 2. Nếu không có, thử tìm trong object 'user'
      if (!token) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            // Kiểm tra các trường hợp tên biến phổ biến
            token = user.accessToken || user.access_token || user.token;
          } catch (e) {
            console.error("Lỗi parse user từ localStorage", e);
          }
        }
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;