import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Review } from '../entities/review.entity';
import { ProductsService } from '../products/products.service';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    private readonly productsService: ProductsService,
  ) {}

  async create(createReviewDto: any): Promise<Review> {
    const { userId, productId, rating, comment, title } = createReviewDto;

    // Check if user already reviewed this product
    const existingReview = await this.reviewRepository.findOne({
      where: { 
        user: { id: userId },
        product: { id: productId }
      }
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }

    const review = this.reviewRepository.create({
      title,
      comment,
      rating,
      user: { id: userId },
      product: { id: productId },
      isApproved: false // Always pending by default
    });

    return this.reviewRepository.save(review);
  }

  async findAll(status?: 'pending' | 'approved'): Promise<Review[]> {
    const where: any = {};
    if (status === 'pending') where.isApproved = false;
    if (status === 'approved') where.isApproved = true;

    return this.reviewRepository.find({ 
      where,
      relations: ['user', 'product'],
      order: { id: 'DESC' }
    });
  }

  async findByProduct(productId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { 
        product: { id: productId },
        isApproved: true
      },
      relations: ['user'],
      order: { id: 'DESC' }
    });
  }

  async approve(id: number): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['product']
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    review.isApproved = true;
    const savedReview = await this.reviewRepository.save(review);

    // Recalculate product rating
    await this.productsService.recalculateRating(review.product.id);

    return savedReview;
  }

  async findOne(id: number): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'product'],
    });
    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    return review;
  }

  async update(id: number, updateReviewDto: any): Promise<Review> {
    const review = await this.findOne(id);
    this.reviewRepository.merge(review, updateReviewDto);
    const saved = await this.reviewRepository.save(review);
    
    // Always recalculate just in case rating changed
    if (review.isApproved) {
      await this.productsService.recalculateRating(review.product.id);
    }
    
    return saved;
  }

  async remove(id: number): Promise<void> {
    const review = await this.findOne(id);
    const productId = review.product.id;
    const isApproved = review.isApproved;
    
    await this.reviewRepository.remove(review);
    
    if (isApproved) {
      await this.productsService.recalculateRating(productId);
    }
  }
}
