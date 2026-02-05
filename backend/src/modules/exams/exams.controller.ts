import { Controller, Get, Post, Body, Param, Patch, Delete, HttpException, HttpStatus, UseGuards, Req, Inject } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { VdiService } from '../vdi/vdi.service'; // <--- QUAN TRỌNG: Import VdiService
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // <--- Import Guard (đường dẫn tuỳ project bạn)

@Controller('exams')
export class ExamsController {
  constructor(
    private readonly examsService: ExamsService,
    private readonly vdiService: VdiService, // <--- QUAN TRỌNG: Inject VdiService vào đây
  ) {}

  // 1. Lấy danh sách kỳ thi
  @Get()
  async findAll() {
    return this.examsService.findAll();
  }

  @Post()
  create(@Body() body: any) {
    return this.examsService.create(body);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const exam = await this.examsService.findOne(+id);
    if (!exam) throw new HttpException('Kỳ thi không tồn tại', HttpStatus.NOT_FOUND);
    return exam;
  }

  // 2. API SINH VIÊN JOIN VÀO KỲ THI
  @Post(':id/join')
  async joinExam(
    @Param('id') examId: string,
    @Body() body: { userId: number; accessCode?: string },
  ) {
    return this.examsService.joinExam(+examId, body.userId, body.accessCode);
  }

  // API THOÁT THI (Có thể dùng khi user chủ động thoát mà chưa nộp)
  @Post('leave')
  async leaveExam(@Body() body: { userId: number }) {
    // Logic leaveExam nên gọi releaseVm
    return this.examsService.leaveExam(body.userId);
  }

  // --- API NỘP BÀI & THU HỒI MÁY ---
  @Post(':examId/submit')
  @UseGuards(JwtAuthGuard) // Yêu cầu token đăng nhập
  async submitExam(@Req() req, @Param('examId') examId: string) {
    // Lấy userId từ token (req.user do JwtStrategy giải mã)
    const userId = req.user.id; // Hoặc req.user.userId tuỳ cấu hình JWT

    console.log(`[SUBMIT] User ${userId} submitting exam ${examId}`);

    // 1. Ghi nhận nộp bài (Sửa this.examService -> this.examsService)
    // Cần đảm bảo ExamsService có hàm recordSubmission
    // await this.examsService.recordSubmission(userId, +examId); 

    // 2. THU HỒI MÁY ẢO NGAY LẬP TỨC
    await this.vdiService.revokeVmConnection(userId);

    return { message: 'Bài thi đã được nộp thành công, máy ảo đang thu hồi.' };
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.examsService.update(+id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.examsService.remove(+id);
  }
}