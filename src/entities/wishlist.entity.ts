import { Entity, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Product } from './product.entity';
import { User } from './user.entity';

@Entity()
export class Wishlist {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.wishlists)
  user: User;

  @ManyToOne(() => Product, { eager: true })
  product: Product;
}