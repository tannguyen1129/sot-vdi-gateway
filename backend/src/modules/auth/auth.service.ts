import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { UserRole } from '../../entities/user.entity';

@Injectable()
export class AuthService implements OnModuleInit {
  // Tạo Logger để in ra console cho đẹp
  private readonly logger = new Logger(AuthService.name);

  constructor(private usersService: UsersService) {}

  // 1. HÀM TỰ ĐỘNG CHẠY KHI BACKEND KHỞI ĐỘNG
  async onModuleInit() {
    this.logger.log('🔄 Đang kiểm tra tài khoản Admin mặc định...');
    await this.createDefaultAdmin();
  }

  // 2. Logic tạo Admin (Tự động)
  private async createDefaultAdmin() {
    try {
      // Kiểm tra xem đã có admin chưa
      const existingAdmin = await this.usersService.findOne('admin');
      
      if (existingAdmin) {
        this.logger.log('✅ Admin đã tồn tại. Bỏ qua bước tạo mới.');
        return;
      }

      // Nếu chưa có thì tạo mới
      await this.usersService.create({
        username: 'admin',
        password: '7816404122Tan', // Mật khẩu của bạn
        fullName: 'Super Administrator',
        role: UserRole.ADMIN,
        className: 'System'
      });

      this.logger.log('🎉 ĐÃ TẠO ADMIN THÀNH CÔNG! (User: admin | Pass: 7816404122Tan)');
    } catch (error) {
      this.logger.error('❌ Lỗi khi tạo Admin: ' + error.message);
    }
  }

  // 3. Logic Đăng nhập (Giữ nguyên để Frontend dùng)
  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
}