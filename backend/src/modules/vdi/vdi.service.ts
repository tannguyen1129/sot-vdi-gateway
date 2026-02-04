// backend/src/modules/vdi/vdi.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vm } from '../../entities/vm.entity';
import * as crypto from 'crypto';

@Injectable()
export class VdiService {
  private readonly guacCypher = 'AES-256-CBC';
  private readonly guacKey = process.env.GUAC_CRYPT_KEY || 'MySuperSecretKeyForEncryption123';

  constructor(
    @InjectRepository(Vm)
    private vmRepo: Repository<Vm>,
  ) {}

  async allocateVm(userId: number): Promise<Vm> {
    let vm = await this.vmRepo.findOne({ where: { allocatedToUserId: userId } });
    if (vm) return vm;

    vm = await this.vmRepo.findOne({ 
        where: { isAllocated: false },
        order: { port: 'ASC' }
    });
    
    if (!vm) throw new NotFoundException('Hết máy ảo.');

    vm.isAllocated = true;
    vm.allocatedToUserId = userId;
    await this.vmRepo.save(vm);
    
    return vm;
  }

  generateGuacamoleToken(vm: Vm): string {
    const connectionParams = {
      connection: {
        type: 'rdp',
        settings: {
          hostname: vm.ip,
          port: String(vm.port),
          username: vm.username,
          password: vm.password,
          security: 'nla',
          'ignore-cert': 'true',
          'enable-keep-alive': 'true',
          'resize-method': 'display-update',
          dpi: '96',
          'server-layout': 'en-us-qwerty',
          'disable-wallpaper': 'true',
          'disable-theming': 'true',

          'enable-wallpaper': 'false',
          'enable-theming': 'false',
          'enable-font-smoothing': 'false',
          'enable-desktop-composition': 'false',
        },
      },
    };

    return this.encryptGuacamoleToken(connectionParams);
  }

  private encryptGuacamoleToken(payload: object): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.guacCypher, this.guacKey, iv);
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(payload), 'utf8'),
      cipher.final(),
    ]);

    const tokenData = {
      iv: iv.toString('base64'),
      value: encrypted.toString('base64'),
    };

    return Buffer.from(JSON.stringify(tokenData)).toString('base64');
  }

  async releaseVm(userId: number) {
    const vm = await this.vmRepo.findOne({ where: { allocatedToUserId: userId } });
    if (vm) {
      vm.isAllocated = false;
      vm.allocatedToUserId = null;
      await this.vmRepo.save(vm);
    }
  }
}
