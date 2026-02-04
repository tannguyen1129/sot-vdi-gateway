import { Controller, Get, Query, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { VdiService } from './vdi.service';

@Controller('vdi')
export class VdiController {
  constructor(private readonly vdiService: VdiService) {}

  // API lấy Token để kết nối
  @Get('connect')
  async connect(@Query('userId') userId: string) {
    if (!userId) throw new HttpException('Thiếu UserId', HttpStatus.BAD_REQUEST);

    // 1. Cấp phát
    const vm = await this.vdiService.allocateVm(Number(userId));
    
    // 2. Tạo token
    const token = this.vdiService.generateGuacamoleToken(vm);

    return { 
        status: 'success',
        vm_info: { label: vm.username }, 
        token: token 
    };
  }
  
  // API nhả máy (khi logout)
  @Post('release')
  async release(@Body() body: { userId: number }) {
      await this.vdiService.releaseVm(body.userId);
      return { status: 'released' };
  }
}