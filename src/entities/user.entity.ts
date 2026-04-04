import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Order } from './order.entity';
import { Review } from './review.entity';
import { Wishlist } from './wishlist.entity';
import { Notification } from './notification.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: 'user' })
  role: string;

  @OneToMany(() => Order, order => order.user)
  orders: Order[];

  @OneToMany(() => Review, review => review.user)
  reviews: Review[];

  @OneToMany(() => Wishlist, wishlist => wishlist.user)
  wishlists: Wishlist[];

  @OneToMany(() => Notification, notification => notification.user)
  notifications: Notification[];
}