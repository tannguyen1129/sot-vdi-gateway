import axios from 'axios';

// Tạo một instance dùng chung cho cả app
const api = axios.create({
  // Sửa cứng luôn cái giá trị mặc định này cho chắc ăn
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://217.216.33.134:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;