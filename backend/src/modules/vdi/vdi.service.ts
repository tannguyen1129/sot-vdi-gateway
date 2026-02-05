import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule'; // Import chuẩn từ NestJS
import * as crypto from 'crypto';

// Import Entities
import { Vm } from '../../entities/vm.entity';
import { ExamLog } from '../../entities/exam-log.entity';

@Injectable()
export class VdiService {
  private readonly guacCypher = 'AES-256-CBC';
  private readonly guacKey = process.env.GUAC_CRYPT_KEY || 'MySuperSecretKeyForEncryption123';
  private readonly logger = new Logger(VdiService.name);

  // Biến static để lưu instance Guacamole Server (được set từ main.ts)
  public static guacamoleServerInstance: any = null;

  constructor(
    @InjectRepository(Vm)
    private vmRepo: Repository<Vm>,

    // [QUAN TRỌNG] Inject Repository của ExamLog vào đây để dùng được trong hàm Cron
    @InjectRepository(ExamLog)
    private examLogRepo: Repository<ExamLog>,
  ) {}

  // --- TỰ ĐỘNG THU HỒI MÁY TREO (Mỗi phút chạy 1 lần) ---
  @Cron(CronExpression.EVERY_MINUTE)
  async autoReleaseIdleVms() {
    this.logger.debug('[Cron] Đang quét máy ảo treo...');

    // 1. Lấy danh sách máy ảo đang cấp phát (isAllocated = true)
    const activeVms = await this.vmRepo.find({ 
      where: { isAllocated: true } 
    });

    if (activeVms.length === 0) return;

    // 2. Duyệt từng máy để kiểm tra sự sống
    for (const vm of activeVms) {
      if (!vm.allocatedToUserId) continue;

      // Tìm log hoạt động cuối cùng của user này
      const lastLog = await this.examLogRepo.findOne({
        where: { userId: vm.allocatedToUserId },
        order: { createdAt: 'DESC' }, // Lấy cái mới nhất
      });

      // 3. Logic kiểm tra thời gian
      const now = new Date();
      // Timeout là 10 phút (Nếu không có hoạt động gì trong 10p sẽ bị thu hồi)
      const timeoutThreshold = new Date(now.getTime() - 10 * 60 * 1000);

      // Điều kiện thu hồi:
      // - Case 1: Không có log nào (Vào thi nhưng không load được trang hoặc tắt ngay lập tức)
      // - Case 2: Log cuối cùng cũ hơn 10 phút (Đã tắt trình duyệt nghỉ thi)
      if (!lastLog || lastLog.createdAt < timeoutThreshold) {
        this.logger.warn(`[AUTO-CLEANUP] Thu hồi máy ${vm.ip} của User ${vm.allocatedToUserId} do không hoạt động > 10 phút.`);
        
        // Gọi hàm thu hồi (Hàm này nằm ở phần dưới của file)
        await this.revokeVmConnection(vm.allocatedToUserId);
      }
    }
  }

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

    // --- [PHẦN MỚI QUAN TRỌNG] GHI LOG HỆ THỐNG ---
    // Mục đích: Để Admin thấy dòng chữ màu đỏ "REVOKE" trên màn hình giám sát
    try {
        await this.examLogRepo.save({
            userId: userId,
            action: 'REVOKE', 
            details: `Hệ thống tự động thu hồi máy ${vm.ip} do treo quá 10 phút.`,
            clientIp: 'SYSTEM'
        });
    } catch (e) {
        // Chỉ log lỗi ra console, không chặn quy trình thu hồi
        this.logger.error(`Không thể ghi log REVOKE cho user ${userId}: ${e.message}`);
    }

    // 2. Ngắt kết nối Guacamole (Nếu có implement)
    if (VdiService.guacamoleServerInstance) {
        // console.log(`[VDI] Đóng socket Guacamole của User ${userId}`);
        // VdiService.guacamoleServerInstance.closeConnection(userId); 
    }

    // 3. Gọi Proxmox API để tắt máy ảo (Nếu có implement)
    if (vm.vmid) {
       // console.log(`[VDI] Đang tắt Proxmox VM ID: ${vm.vmid}`);
       // await this.proxmoxService.stopVm(vm.vmid); 
    }

    // 4. Giải phóng máy ảo trong Database (Reset isAllocated = false)
    // Hàm này bạn đã có ở dưới, tái sử dụng luôn
    await this.releaseVm(userId);
    
    this.logger.log(`[VDI] Đã thu hồi thành công máy ${vm.ip} của User ${userId}`);
  }
}