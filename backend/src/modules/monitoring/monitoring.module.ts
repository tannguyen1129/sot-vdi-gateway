import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service'; // [MỚI] Import Service
import { ExamLog } from '../../entities/exam-log.entity';
import { Vm } from 'src/entities/vm.entity';
import { User } from 'src/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExamLog, User, Vm])],
  controllers: [MonitoringController],
  providers: [MonitoringService], // [MỚI] Đăng ký Provider ở đây
})
export class MonitoringModule {}