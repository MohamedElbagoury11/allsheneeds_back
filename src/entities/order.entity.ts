import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { OrderItem } from './order_item.entity';

@Entity()
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, user => user.orders)
  user: User;

  @Column('simple-json', { nullable: true })
  shipping: any;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ default: 'processing' })
  status: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date: Date;

  @OneToMany(() => OrderItem, item => item.order, { cascade: true })
  items: OrderItem[];
}