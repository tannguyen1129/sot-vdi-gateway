import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamLog } from '../../entities/exam-log.entity';

@Injectable()
export class MonitoringService {
  constructor(
    @InjectRepository(ExamLog)
    private examLogRepo: Repository<ExamLog>,
  ) {}

  // 1. Lấy tất cả logs của 1 kỳ thi (để export)
  async getLogsByExam(examId: number) {
    return this.examLogRepo.find({
      where: { examId },
      relations: ['user'], // Join bảng User để lấy tên/mssv
      order: { createdAt: 'DESC' },
    });
  }

  // 2. Xóa sạch logs của 1 kỳ thi
  async clearLogsByExam(examId: number) {
    // Chỉ xóa log của examId đó
    return this.examLogRepo.delete({ examId });
  }
}