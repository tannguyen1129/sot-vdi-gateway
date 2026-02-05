import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../entities/user.entity';
import { Vm } from '../../entities/vm.entity';
import * as XLSX from 'xlsx';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Vm) private vmRepo: Repository<Vm>,
  ) {}

  // 1. IMPORT SINH VIÊN (Giữ nguyên - Code này ok)
  async importUsers(fileBuffer: Buffer) {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);
    
    let countNew = 0;
    let countUpdate = 0;

    for (const row of data as any[]) {
      // 1. Mapping các cột cơ bản (thêm nhiều key để user dễ nhập file excel)
      const mssv = row['mssv'] || row['username'] || row['User Name'] || row['Student ID'] || row['User ID'];
      const hoTen = row['ho_ten'] || row['fullName'] || row['Full Name'] || row['Name'] || row['Họ Tên'];
      const lop = row['lop'] || row['className'] || row['Class Name'] || row['Class'] || 'K14-CNTT';
      const matKhau = row['mat_khau'] || row['password'] || row['Password'] || '123456';

      // 2. [MỚI] Mapping cột Khoa / Trường / Đơn vị
      // Hệ thống sẽ tự tìm cột có tên 'khoa', 'truong', 'department', 'DonVi'...
      const khoa = row['khoa'] || row['truong'] || row['don_vi'] || row['department'] || row['Department'] || row['Khoa'] || row['Trường'] || row['Đơn vị'];

      if (!mssv) continue;

      const user = await this.userRepo.findOne({ where: { username: mssv.toString().trim() } });
      
      if (user) {
        // --- LOGIC CẬP NHẬT (UPDATE) ---
        user.password = matKhau.toString().trim();
        if (hoTen) user.fullName = hoTen.toString().trim();
        if (lop) user.className = lop.toString().trim();
        
        // [MỚI] Cập nhật thông tin Khoa nếu có trong file Excel
        if (khoa) user.department = khoa.toString().trim();

        await this.userRepo.save(user);
        countUpdate++;
      } else {
        // --- LOGIC TẠO MỚI (CREATE) ---
        await this.userRepo.save({
          username: mssv.toString().trim(),
          password: matKhau.toString().trim(),
          fullName: hoTen ? hoTen.toString().trim() : `Sinh viên ${mssv}`,
          className: lop ? lop.toString().trim() : '',
          department: khoa ? khoa.toString().trim() : null,
          
          role: UserRole.STUDENT,
          isActive: true // Mặc định kích hoạt
        });
        countNew++;
      }
    }
    
    return { message: `Xử lý xong: Thêm mới ${countNew}, Cập nhật ${countUpdate} tài khoản.` };
  }

  // ==================================================================
  // 2. IMPORT VM (ĐÃ SỬA LỖI LOGIC PORT)
  // ==================================================================
  async importVms(fileBuffer: Buffer) {
    console.log("--> BẮT ĐẦU IMPORT VM (THEO PORT)...");
    
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    let countNew = 0;
    let countUpdate = 0;
    let countError = 0;

    for (let i = 0; i < data.length; i++) {
        const row = data[i] as any;
        try {
            const ip = row['ip'] || row['IP'] || row['Ip Address'] || row['Host'];
            const port = row['port'] || row['Port']; // BẮT BUỘC PHẢI CÓ PORT
            const username = row['username'] || row['User'] || row['Username'] || 'coder';
            const password = row['password'] || row['Pass'] || row['Mật khẩu'] || 'techgen2024';

            // Nếu thiếu IP hoặc Port thì bỏ qua (Vì đây là 2 khóa chính để định danh)
            if (!ip || !port) {
                console.warn(`Dòng ${i}: Thiếu IP hoặc Port -> Bỏ qua`);
                countError++;
                continue;
            }

            const ipString = ip.toString().trim();
            const portNumber = Number(port); // Convert sang số
            const userString = username.toString().trim();

            // SỬA LỖI Ở ĐÂY: Tìm theo IP và PORT (Chứ không tìm theo User nữa)
            // Vì một User "coder" có thể nằm ở 100 port khác nhau
            const existingVm = await this.vmRepo.findOne({ 
                where: { 
                    ip: ipString, 
                    port: portNumber,
                    username: userString
                } 
            });

            if (existingVm) {
                // UPDATE: Cập nhật lại user/pass nếu file Excel thay đổi
                existingVm.username = userString;
                existingVm.password = password.toString().trim();
                await this.vmRepo.save(existingVm);
                countUpdate++;
            } else {
                // CREATE: Tạo mới vì chưa có cặp IP:PORT này
                await this.vmRepo.save({
                    ip: ipString,
                    port: portNumber,
                    username: userString,
                    password: password.toString().trim(),
                    isAllocated: false,
                    allocatedToUserId: null
                });
                countNew++;
            }
        } catch (error) {
            console.error(`Lỗi dòng ${i}:`, error.message);
            countError++;
        }
    }
    return { message: `Import VM hoàn tất! Mới: ${countNew}, Cập nhật: ${countUpdate}, Lỗi: ${countError}` };
  }

  // 3. CÁC HÀM KHÁC (Giữ nguyên)
  async getAllStudents() {
    return this.userRepo.find({ where: { role: UserRole.STUDENT }, order: { username: 'ASC' } });
  }

  async getAllVms() {
    return this.vmRepo.find({ order: { ip: 'ASC', port: 'ASC' } }); // Sắp xếp theo Port tăng dần (31001, 31002...)
  }

  async updateVm(id: number, data: Partial<Vm>) {
    const vm = await this.vmRepo.findOne({ where: { id } });
    if (!vm) throw new NotFoundException('Không tìm thấy máy ảo');
    
    if (data.ip) vm.ip = data.ip;
    if (data.port) vm.port = data.port;
    if (data.username) vm.username = data.username;
    if (data.password) vm.password = data.password;
    
    return this.vmRepo.save(vm);
  }

  async deleteVm(id: number) {
    const result = await this.vmRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Không tìm thấy ID để xóa');
    return { message: 'Đã xóa thành công' };
  }
}