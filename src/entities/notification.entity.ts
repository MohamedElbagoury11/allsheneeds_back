import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  type: string;

  @Column({ nullable: true })
  title: string;

  @Column()
  message: string;

  @Column({ default: false })
  read: boolean;

  @ManyToOne(() => User, user => user.notifications)
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}