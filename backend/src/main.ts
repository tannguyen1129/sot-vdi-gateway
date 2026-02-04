// backend/src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Server } from 'socket.io';
import GuacamoleLite from 'guacamole-lite';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const server = app.getHttpServer();
  await app.listen(3000);

  // Socket.io config (Không ảnh hưởng trực tiếp đến Guacamole nhưng cứ giữ nguyên)
  const io = new Server(server, { 
    cors: { origin: '*' },
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e8 
  });

  const guacdOptions = {
    host: 'umt_guacd',
    port: 4822,
  };

  const clientOptions = {
    crypt: {
      cypher: 'AES-256-CBC',
      key: 'MySuperSecretKeyForEncryption123' 
    },
    log: {
        level: 'ERR'
    },
    // [QUAN TRỌNG - BẮT BUỘC PHẢI CÓ DÒNG NÀY ĐỂ FIX DISCONNECT]
    // Tăng thời gian chờ từ 10s (mặc định) lên 30s
    maxInactivityTime: 30000 
  };

  // @ts-ignore
  new GuacamoleLite(
    { server, path: '/guaclite' }, 
    guacdOptions, 
    clientOptions
  );
  
  console.log('VDI Portal Backend is running on port 3000');
}
bootstrap();