import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('exams')
export class Exam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // Tên kỳ thi (VD: CSLT Spring 2026)

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true }) // Access Code (có thể để trống)
  accessCode: string;

  @Column({ type: 'timestamptz' }) // Thêm type: 'timestamptz' vào
  startTime: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endTime: Date;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  // Một kỳ thi có nhiều sinh viên
  @OneToMany(() => User, (user) => user.exam)
  students: User[];
}