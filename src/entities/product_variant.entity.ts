import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Product } from './product.entity';

@Entity()
export class ProductVariant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  size: string;

  @Column()
  color: string;

  @Column('int')
  stock: number;

  @ManyToOne(() => Product, product => product.variants)
  product: Product;
}