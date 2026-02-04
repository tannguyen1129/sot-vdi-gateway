import { Controller, Post, Get, UseInterceptors, UploadedFile, BadRequestException, Put, Delete, Param, Body } from '@nestjs/common'; // Thêm Get
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // --- IMPORT (Giữ nguyên) ---
  @Post('import-users')
  @UseInterceptors(FileInterceptor('file'))
  async importUsers(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Chưa chọn file!');
    return this.adminService.importUsers(file.buffer);
  }

  @Post('import-vms')
  @UseInterceptors(FileInterceptor('file'))
  async importVms(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Chưa chọn file!');
    return this.adminService.importVms(file.buffer);
  }

  // --- MỚI: API LẤY DANH SÁCH ---
  @Get('users')
  async getAllStudents() {
    return this.adminService.getAllStudents();
  }

  @Get('vms')
  async getAllVms() {
    return this.adminService.getAllVms();
  }

  @Put('vms/:id')
  async updateVm(@Param('id') id: string, @Body() body: any) {
    return this.adminService.updateVm(Number(id), body);
  }

  // API Xóa máy ảo
  @Delete('vms/:id')
  async deleteVm(@Param('id') id: string) {
    return this.adminService.deleteVm(Number(id));
  }
}