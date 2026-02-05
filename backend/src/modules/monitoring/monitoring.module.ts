// backend/src/modules/monitoring/monitoring.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitoringController } from './monitoring.controller';
import { ExamLog } from '../../entities/exam-log.entity';
import { Vm } from 'src/entities/vm.entity';
import { User } from 'src/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ExamLog, User, Vm])], // <--- Thêm User, Vm
  controllers: [MonitoringController],
})
export class MonitoringModule {}