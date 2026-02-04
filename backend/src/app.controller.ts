import { Controller, Get, Query, UnauthorizedException } from '@nestjs/common';
import { VdiService } from './modules/vdi/vdi.service';

@Controller()
export class AppController {
  constructor(private readonly vdiService: VdiService) {}

  @Get('join-exam')
  async joinExam(@Query('userId') userId: string) {
    if (!userId) throw new UnauthorizedException('Missing User ID');

    // 1. Cấp phát máy (lấy từ DB)
    const vm = await this.vdiService.allocateVm(Number(userId));
    
    // 2. Tạo token
    const token = this.vdiService.generateGuacamoleToken(vm);

    // 3. Trả về token cho Frontend
    return { token };
  }
}