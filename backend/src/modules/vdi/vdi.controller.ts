// backend/src/modules/vdi/vdi.controller.ts
import { Controller, Post, UseGuards, Request, Body } from '@nestjs/common'; // <--- Đã thêm Body
import { VdiService } from './vdi.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('vdi')
export class VdiController {
  constructor(private readonly vdiService: VdiService) {}

  @Post('connect')
  @UseGuards(JwtAuthGuard)
  async connect(@Request() req) {
    const user = req.user;
    const vm = await this.vdiService.allocateVm(user.id);
    const token = this.vdiService.generateGuacamoleToken(vm);

    return {
      status: 'success',
      vm_info: { label: vm.username },
      token: token,
      ws_path: '/guaclite' 
    };
  }
  
  // API nhả máy (khi logout)
  @Post('release')
  async release(@Body() body: { userId: number }) {
      await this.vdiService.releaseVm(body.userId);
      return { status: 'released' };
  }
}