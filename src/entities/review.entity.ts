import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Product } from './product.entity';
import { User } from './user.entity';

@Entity()
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  comment: string;

  @Column('int')
  rating: number;

  @ManyToOne(() => Product, product => product.reviews)
  product: Product;

  @ManyToOne(() => User, user => user.reviews)
  user: User;
}