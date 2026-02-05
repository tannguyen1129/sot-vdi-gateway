import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VdiService } from './vdi.service';
import { VdiController } from './vdi.controller';
import { Vm } from '../../entities/vm.entity';
import { ExamLog } from 'src/entities/exam-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vm, ExamLog])], // Thêm ExamLog vào đây
  controllers: [VdiController],
  providers: [VdiService],
  exports: [VdiService],
})
export class VdiModule {}