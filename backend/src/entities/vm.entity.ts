import { Entity, Column, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Vm {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  ip: string;

  @Column()
  port: number;

  @Column()
  username: string;

  @Column()
  password: string;

  @Column({ default: false })
  isAllocated: boolean;

  // --- SỬA DÒNG NÀY ---
  @Column({ type: 'int', nullable: true }) // Thêm type: 'int' để Postgres hiểu đây là số
  allocatedToUserId: number | null;

  @UpdateDateColumn()
  lastActivity: Date;
}