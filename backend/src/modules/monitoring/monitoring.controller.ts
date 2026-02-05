import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamLog } from '../../entities/exam-log.entity';
import { User } from '../../entities/user.entity';
import { Vm } from '../../entities/vm.entity';
import { MonitoringService } from './monitoring.service';


@Controller('monitoring')
export class MonitoringController {
  monitoringService: any;
  constructor(
    @InjectRepository(ExamLog) private logRepo: Repository<ExamLog>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Vm) private vmRepo: Repository<Vm>,
  ) {}

  // 1. Ghi Log (Giữ nguyên)
  @Post('log')
  async logActivity(@Body() body: any) {
    const log = this.logRepo.create(body);
    return await this.logRepo.save(log);
  }

  // 2. Lấy Log chi tiết (Giữ nguyên)
  @Get(':examId/logs')
  async getExamLogs(@Param('examId') examId: number) {
    return await this.logRepo.find({
      where: { examId },
      order: { createdAt: 'DESC' },
      relations: ['user'],
      take: 100 // Chỉ lấy 100 log mới nhất để đỡ lag
    });
  }

  // 3. [MỚI] API LIVE MONITORING (Quan trọng)
  // Trả về danh sách sinh viên kèm: Máy VM đang giữ, IP Client mới nhất, Trạng thái
  @Get(':examId/live')
  async getLiveStatus(@Param('examId') examId: number) {
    // A. Lấy tất cả sinh viên trong kỳ thi
    const students = await this.userRepo.find({
      where: { examId },
      order: { username: 'ASC' }
    });

    // B. Lấy danh sách máy ảo đang được cấp phát
    const allocatedVms = await this.vmRepo.find({
        where: { isAllocated: true }
    });

    // C. Map dữ liệu để trả về Frontend
    const liveData = await Promise.all(students.map(async (student) => {
        // Tìm máy ảo của sinh viên này
        const myVm = allocatedVms.find(vm => vm.allocatedToUserId === student.id);
        
        // Tìm log mới nhất để lấy Client IP và hành động cuối
        const lastLog = await this.logRepo.findOne({
            where: { userId: student.id, examId },
            order: { createdAt: 'DESC' }
        });

        return {
            student: {
                id: student.id,
                fullName: student.fullName,
                username: student.username,
                className: student.className
            },
            vm: myVm ? {
                ip: myVm.ip,
                username: myVm.username,
                port: myVm.port
            } : null, // Nếu null nghĩa là chưa vào thi hoặc đã thoát
            client: {
                ip: lastLog?.clientIp || 'N/A',
                lastAction: lastLog?.action || 'NONE',
                lastSeen: lastLog?.createdAt || null
            },
            // Cờ đánh dấu vi phạm (Nếu hành động cuối là Vi phạm)
            isViolation: ['VIOLATION_FULLSCREEN', 'UNLOCK_MOUSE'].includes(lastLog?.action || '')
        };
    }));

    return liveData;
  }

  // 4. Lấy full logs để export Excel
  @Get(':examId/all')
  async getAllLogs(@Param('examId') examId: string) {
    return this.monitoringService.getLogsByExam(+examId);
  }

  // 5. Xóa toàn bộ logs của kỳ thi
  @Delete(':examId/clear')
  async clearLogs(@Param('examId') examId: string) {
    await this.monitoringService.clearLogsByExam(+examId);
    return { message: 'Đã xóa toàn bộ nhật ký giám sát.' };
  }
  
}