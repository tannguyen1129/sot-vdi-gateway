import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vm } from '../../entities/vm.entity';
import * as crypto from 'crypto';

// Giả sử bạn có ProxmoxService để gọi API tắt máy (Nếu chưa có thì cần tạo)
// import { ProxmoxService } from '../proxmox/proxmox.service'; 

@Injectable()
export class VdiService {
  private readonly guacCypher = 'AES-256-CBC';
  private readonly guacKey = process.env.GUAC_CRYPT_KEY || 'MySuperSecretKeyForEncryption123';

  // Biến lưu trữ instance Guacamole Server (Cần được set từ main.ts hoặc module khác)
  public static guacamoleServerInstance: any = null;

  constructor(
    @InjectRepository(Vm)
    private vmRepo: Repository<Vm>,
    // @Inject(ProxmoxService) private proxmoxService: ProxmoxService, // Uncomment nếu đã có service này
  ) {}

  async allocateVm(userId: number): Promise<Vm> {
    let vm = await this.vmRepo.findOne({ where: { allocatedToUserId: userId } });
    if (vm) return vm;

    vm = await this.vmRepo.findOne({
      where: { isAllocated: false },
      order: { port: 'ASC' },
    });

    if (!vm) throw new NotFoundException('Hết máy ảo.');

    vm.isAllocated = true;
    vm.allocatedToUserId = userId;
    await this.vmRepo.save(vm);

    return vm;
  }

generateGuacamoleToken(vm: Vm): string {
    const connectionParams = {
      connection: {
        type: 'rdp',
        settings: {
          hostname: vm.ip,
          port: String(vm.port),
          username: vm.username,
          password: vm.password,
          security: 'nla',
          'ignore-cert': true,

          // --- CẤU HÌNH HÌNH ẢNH (GIỮ NGUYÊN) ---
          'disable-gfx': false, 
          'color-depth': 32,
          'resize-method': 'display-update',
          'enable-wallpaper': true,   
          'enable-theming': true,
          'enable-font-smoothing': true,
          'enable-menu-animations': true,
          'enable-desktop-composition': true,

          // --- [FIX QUAN TRỌNG] TẮT AUDIO ĐỂ TRÁNH SẬP SOCKET ---
          // Thêm 2 dòng này vào:
          'disable-audio': true, 
          'enable-audio-input': false, 

          // Tắt cache để tránh rác
          'disable-bitmap-caching': true,
          'disable-offscreen-caching': true,
          'disable-glyph-caching': true,

          dpi: 96,
          'server-layout': 'en-us-qwerty',
        },
      },
    };

    return this.encryptGuacamoleToken(connectionParams);
  }

  private encryptGuacamoleToken(payload: object): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.guacCypher, this.guacKey, iv);
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(payload), 'utf8'),
      cipher.final(),
    ]);

    const tokenData = {
      iv: iv.toString('base64'),
      value: encrypted.toString('base64'),
    };

    return Buffer.from(JSON.stringify(tokenData)).toString('base64');
  }

  async releaseVm(userId: number) {
    const vm = await this.vmRepo.findOne({ where: { allocatedToUserId: userId } });
    if (vm) {
      vm.isAllocated = false;
      vm.allocatedToUserId = null;
      await this.vmRepo.save(vm);
    }
  }

  // --- HÀM THU HỒI MÁY ẢO ---
  async revokeVmConnection(userId: number) {
    // 1. Tìm VM đang cấp cho User này
    const vm = await this.vmRepo.findOne({ where: { allocatedToUserId: userId } });
    
    if (!vm) return; // User không có máy ảo nào

    // 2. Ngắt kết nối Guacamole
    // Lưu ý: GuacamoleLite nằm ở tầng Socket, Service này khó gọi trực tiếp nếu không dùng Singleton hoặc Global.
    // Đây là cách đi đường vòng thông qua biến Static (hoặc bạn dùng Redis Pub/Sub để bắn sự kiện)
    if (VdiService.guacamoleServerInstance) {
        // Giả sử server có hàm closeConnection(clientIdentifier)
        // Bạn cần implement logic map userId -> connectionId trong GuacamoleLite
        console.log(`[VDI] Closing connection for User ${userId}`);
        // VdiService.guacamoleServerInstance.closeConnection(userId); 
    }

    // 3. Gọi Proxmox API để tắt máy ảo (Stop VM)
    if (vm.vmid) {
       console.log(`[VDI] Stopping Proxmox VM ID: ${vm.vmid}`);
       // await this.proxmoxService.stopVm(vm.vmid); // Uncomment khi có Proxmox Service
    }

    // 4. Giải phóng database
    await this.releaseVm(userId);
  }
}