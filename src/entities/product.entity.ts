import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Category } from './category.entity';
import { ProductVariant } from './product_variant.entity';
import { ProductImage } from './product_image.entity';
import { Review } from './review.entity';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;
  
  @Column({ nullable: true })
  categoryName: string; // The frontend expects category to be a string representing the name

  @ManyToOne(() => Category, category => category.products)
  category: Category;

  @Column('simple-json', { nullable: true })
  images: string[];

  @Column('decimal', { precision: 2, scale: 1, default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewsCount: number;

  @Column({ default: 0 })
  stock: number;

  @Column('simple-json', { nullable: true })
  specifications: any;

  @OneToMany(() => ProductVariant, variant => variant.product)
  variants: ProductVariant[];

  // Keep relation for backward compat if needed, but primary is JSON array 'images'
  @OneToMany(() => ProductImage, image => image.product)
  imageRelations: ProductImage[];

  @OneToMany(() => Review, review => review.product)
  reviews: Review[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}