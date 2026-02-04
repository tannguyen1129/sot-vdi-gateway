import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // Tìm một user theo username (Dùng cho Login)
  async findOne(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  // Tìm user theo ID (Dùng cho VDI)
  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  // Hàm tạo User mới (Dùng cho Admin import Excel)
  // Logic này tách ra để tái sử dụng
  async create(userData: Partial<User>): Promise<User> {
    const newUser = this.usersRepository.create(userData);
    return this.usersRepository.save(newUser);
  }

  async updateExam(userId: number, examId: number) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (user) {
      user.examId = examId;
      return this.usersRepository.save(user);
    }
    return null;
  }
}