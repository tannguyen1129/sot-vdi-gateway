import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VdiService } from './vdi.service';
import { VdiController } from './vdi.controller';
import { Vm } from '../../entities/vm.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vm])],
  controllers: [VdiController],
  providers: [VdiService],
  exports: [VdiService] // <--- THÊM DÒNG NÀY (Để ExamsModule dùng được)
})
export class VdiModule {}