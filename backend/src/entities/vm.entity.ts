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


  @Column({ type: 'int', nullable: true }) 
  allocatedToUserId: number | null;

  @Column({ nullable: true })
  vmid: number;

  @UpdateDateColumn()
  lastActivity: Date;
}