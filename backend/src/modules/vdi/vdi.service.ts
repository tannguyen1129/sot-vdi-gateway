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

        // Nếu máy bắt NLA thì cần username/password (nếu bỏ có thể fail)
        // Manual: NLA cần credentials hoặc prompting :contentReference[oaicite:7]{index=7}
        username: vm.username,
        password: vm.password,

        security: 'any',
        'ignore-cert': 'true',
        timeout: '60', // seconds :contentReference[oaicite:8]{index=8}

        // Performance/stability
        'disable-gfx': 'true',                // :contentReference[oaicite:9]{index=9}
        'color-depth': '16',                  // :contentReference[oaicite:10]{index=10}
        'disable-bitmap-caching': 'true',     // :contentReference[oaicite:11]{index=11}
        'disable-offscreen-caching': 'true',  // :contentReference[oaicite:12]{index=12}
        'disable-glyph-caching': 'true',      // :contentReference[oaicite:13]{index=13}
        'disable-audio': 'true',              // :contentReference[oaicite:14]{index=14}

        'resize-method': 'display-update',    // :contentReference[oaicite:15]{index=15}
        dpi: '96',
        'server-layout': 'en-us-qwerty',

        // Các flag kiểu enable-wallpaper/enable-theming... mặc định đã FALSE :contentReference[oaicite:16]{index=16}
        // => KHÔNG cần set "disable-wallpaper" gì cả.
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