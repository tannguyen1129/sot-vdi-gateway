import { Controller, Get, Post, Body, Param, Patch, Delete, HttpException, HttpStatus } from '@nestjs/common';
import { ExamsService } from './exams.service';

@Controller('exams')
export class ExamsController {
  constructor(
    private readonly examsService: ExamsService,
  ) {}

  // 1. Lấy danh sách kỳ thi (Cho cả Admin xem list và SV xem bài thi đang mở)
  @Get()
  async findAll() { 
    return this.examsService.findAll(); 
  }

  @Post()
  create(@Body() body: any) { return this.examsService.create(body); }

  @Get(':id') // <--- QUAN TRỌNG: Định nghĩa route GET /exams/:id
async findOne(@Param('id') id: string) {
  const exam = await this.examsService.findOne(+id);
  if (!exam) throw new HttpException('Kỳ thi không tồn tại', HttpStatus.NOT_FOUND);
  return exam;
}

  // 2. [QUAN TRỌNG] API SINH VIÊN JOIN VÀO KỲ THI
  @Post(':id/join')
  async joinExam(
    @Param('id') examId: string, 
    @Body() body: { userId: number, accessCode?: string }
  ) {
    // Chỉ gọi examsService là đủ, nó tự lo hết
    return this.examsService.joinExam(+examId, body.userId, body.accessCode);
  }

  // API THOÁT THI
  @Post('leave')
  async leaveExam(@Body() body: { userId: number }) {
    return this.examsService.leaveExam(body.userId);
  }

  @Patch(':id') // Dùng để sửa tên, mô tả, bật/tắt
  update(@Param('id') id: string, @Body() body: any) {
    return this.examsService.update(+id, body);
  }

  @Delete(':id') // Dùng để xóa
  remove(@Param('id') id: string) {
    return this.examsService.remove(+id);
  }
}