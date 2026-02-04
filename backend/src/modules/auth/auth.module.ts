import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module'; // Import UsersModule
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [UsersModule], // <-- Dùng lại logic của Users
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}