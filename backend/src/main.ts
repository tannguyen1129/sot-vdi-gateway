// backend/src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

// Dùng require để tránh lỗi constructor
const GuacamoleLite = require('guacamole-lite');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: '*', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const server = app.getHttpServer();

  const guacdOptions = {
    host: 'umt_guacd',
    port: 4822,
  };

  const guacCrypt = {
    cypher: 'AES-256-CBC',
    key: process.env.GUAC_CRYPT_KEY || 'MySuperSecretKeyForEncryption123',
  };

  const clientOptions = {
    // [BẮT BUỘC] Key phải trùng với nơi tạo token (VdiService)
    crypt: guacCrypt,
    
    // [FIX QUAN TRỌNG]: XÓA BỎ 'allowedUnencryptedConnectionSettings'
    // Để tránh lỗi "includes is not a function" gây sập kết nối.
    
    log: {
      level: 'DEBUG'
    },
    maxInactivityTime: 0
  };

  const guacCallbacks = {
    processConnectionSettings: function (settings, callback) {
      // settings: { connection: { ... }, ... }
      if (!settings || !settings.connection) {
        return callback(new Error('Missing connection settings'));
      }

      try {
        const connection = settings.connection;
        const targetSettings = connection.settings ? connection.settings : connection;

        const normalizeDimension = (value: unknown, multiple = 4, min = 100) => {
          const n = Number(value);
          if (!Number.isFinite(n)) return undefined;
          const intVal = Math.max(min, Math.floor(n));
          return intVal - (intVal % multiple);
        };

        const width = normalizeDimension(settings.width ?? targetSettings.width, 4, 100);
        if (width) targetSettings.width = width;

        const height = normalizeDimension(settings.height ?? targetSettings.height, 4, 100);
        if (height) targetSettings.height = height;

        const dpiRaw = Number(settings.dpi ?? targetSettings.dpi);
        if (Number.isFinite(dpiRaw) && dpiRaw > 0) {
          targetSettings.dpi = Math.round(dpiRaw);
        }

        const host =
          targetSettings.hostname ||
          connection.hostname ||
          connection.settings?.hostname;

        console.log('[Guac] ✅ Token accepted for Host:', host);

        callback(null, settings);
      } catch (err) {
        console.error('[Guac] ❌ Token Error:', err.message);
        callback(new Error('Token validation failed'));
      }
    }
  };

  // Khởi tạo Guacamole Lite
  // @ts-ignore
  new GuacamoleLite(
    { server, path: '/guaclite' }, 
    guacdOptions, 
    clientOptions,
    guacCallbacks
  );

  await app.listen(3000);
  console.log('VDI Backend running on port 3000');
}
bootstrap();