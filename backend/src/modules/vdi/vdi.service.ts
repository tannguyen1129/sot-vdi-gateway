import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vm } from '../../entities/vm.entity';
import * as crypto from 'crypto';

@Injectable()
export class VdiService {
  constructor(
    @InjectRepository(Vm)
    private vmRepo: Repository<Vm>,
  ) {}

  async allocateVm(userId: number): Promise<Vm> {
    let vm = await this.vmRepo.findOne({ where: { allocatedToUserId: userId } });
    if (vm) return vm;

    // Tìm máy chưa cấp phát (Ưu tiên máy có Port nhỏ nhất để gọn)
    vm = await this.vmRepo.findOne({ 
        where: { isAllocated: false },
        order: { port: 'ASC' }
    });
    
    if (!vm) throw new NotFoundException('Hệ thống hết máy ảo. Vui lòng liên hệ giám thị.');

    vm.isAllocated = true;
    vm.allocatedToUserId = userId;
    await this.vmRepo.save(vm);
    
    return vm;
  }

  // --- HÀM TẠO TOKEN (PHIÊN BẢN VNC - NO PASSWORD) ---
generateGuacamoleToken(vm: Vm): string {
    const connectionSettings = {
      connection: {
        type: 'rdp',
        settings: {
          hostname: vm.ip,
          port: String(vm.port),
          username: vm.username,
          password: vm.password,
          
          // --- [FIX] BẢO MẬT & MẠNG ---
          security: 'any',
          'ignore-cert': 'true',
          'enable-keep-alive': 'true',       // [QUAN TRỌNG] Giữ kết nối
          'keep-alive-interval': '30',       // Ping mỗi 30s
          
          // --- HIỆU NĂNG ---
          'disable-wallpaper': 'true',
          'disable-theming': 'true',
          'disable-menu-animations': 'true',
          'disable-aero': 'true',
          
          // Bật cache để đỡ tốn băng thông
          'disable-bitmap-caching': 'true',
          'disable-offscreen-caching': 'true',
          'disable-glyph-caching': 'true',
          
          'disable-audio': 'true',          
          'color-depth': '32',        
          
          'enable-font-smoothing': 'false',
          'disable-full-window-drag': 'true',
          
          'force-lossless': 'true',
          'resize-method': 'display-update', // Resize mượt mà
          dpi: '96',
          'server-layout': 'en-us-qwerty',
        },
      },
    };

    // Mã hóa Token (Giữ nguyên logic cũ)
    const keyString = 'MySuperSecretKeyForEncryption123';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', keyString, iv);
    
    let encrypted = cipher.update(JSON.stringify(connectionSettings), 'utf8', 'base64');
    encrypted += cipher.final('base64');

    return Buffer.from(JSON.stringify({ 
        iv: iv.toString('base64'), 
        value: encrypted 
    })).toString('base64');
  }

  async releaseVm(userId: number) {
    const vm = await this.vmRepo.findOne({ where: { allocatedToUserId: userId } });
    if (vm) {
      vm.isAllocated = false;
      vm.allocatedToUserId = null;
      await this.vmRepo.save(vm);
    }
  }
}