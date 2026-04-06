import {
  Controller,
  Get,
  ForbiddenException,
  Request,
  UnauthorizedException,
  Headers,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { User } from './entities/user.entity';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order_item.entity';
import { Review } from './entities/review.entity';
import { Wishlist } from './entities/wishlist.entity';
import { Notification } from './entities/notification.entity';

/**
 * Seed controller — for development/testing and INITIAL production setup.
 */
@Controller('seed')
export class SeedController {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Category) private catRepo: Repository<Category>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Review) private reviewRepo: Repository<Review>,
    @InjectRepository(Wishlist) private wishlistRepo: Repository<Wishlist>,
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
  ) {}

  @Get()
  async runSeed(@Headers('authorization') authHeader: string) {
    const userCount = await this.userRepo.count();

    if (userCount > 0) {
      if (process.env.NODE_ENV === 'production') {
        throw new ForbiddenException('Seed is disabled in production once the database has users.');
      }

      // If in dev and already seeded, require admin token to re-seed
      if (!authHeader) {
        throw new UnauthorizedException('Admin token required to re-seed the database');
      }
      
      try {
        const token = authHeader.split(' ')[1];
        const payload = this.jwtService.verify(token);
        if (!payload.role || !payload.role.includes('admin')) {
          throw new ForbiddenException('Admin role required');
        }
      } catch (e) {
        throw new UnauthorizedException('Invalid or expired admin token');
      }
    }

    // ──────────────── USERS ────────────────
    const hashedPassword = await bcrypt.hash('password123', 12);

    const user1 = await this.userRepo.save({
      name: 'Jane Doe',
      email: 'jane@store.com',
      password: hashedPassword,
      role: 'user',
    } as any);

    const user2 = await this.userRepo.save({
      name: 'John Smith',
      email: 'john@store.com',
      password: hashedPassword,
      role: 'user',
    } as any);

    const admin = await this.userRepo.save({
      name: 'Admin User',
      email: 'admin@store.com',
      password: hashedPassword,
      role: 'admin',
    } as any);

    // ──────────────── CATEGORIES ────────────────
    const electronics = await this.catRepo.save({
      name: 'Electronics',
      slug: 'electronics',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
      count: 45,
    } as any);

    const fashion = await this.catRepo.save({
      name: 'Fashion',
      slug: 'fashion',
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400',
      count: 120,
    } as any);

    const home = await this.catRepo.save({
      name: 'Home & Living',
      slug: 'home-living',
      image: 'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=400',
      count: 78,
    } as any);

    const sports = await this.catRepo.save({
      name: 'Sports & Outdoors',
      slug: 'sports-outdoors',
      image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400',
      count: 34,
    } as any);

    const beauty = await this.catRepo.save({
      name: 'Beauty & Care',
      slug: 'beauty-care',
      image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400',
      count: 56,
    } as any);

    const books = await this.catRepo.save({
      name: 'Books',
      slug: 'books',
      image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400',
      count: 200,
    } as any);

    // ──────────────── PRODUCTS ────────────────
    const products = await this.productRepo.save([
      {
        name: 'Premium Wireless Headphones',
        description: 'Experience crystal-clear audio with our premium wireless headphones featuring active noise cancellation, 30-hour battery life, and ultra-comfortable memory foam ear cups. Perfect for music lovers and professionals alike.',
        price: 299.99,
        categoryName: 'Electronics',
        category: electronics,
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=600',
          'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=600',
        ],
        rating: 4.8,
        reviewsCount: 234,
        stock: 50,
        specifications: { Brand: 'AudioPro', Color: 'Matte Black', Connectivity: 'Bluetooth 5.3', Battery: '30 hours', Weight: '250g' },
      },
      {
        name: 'Ultra-Slim Laptop Pro',
        description: 'Unleash your productivity with the Ultra-Slim Laptop Pro. Featuring a stunning 14" 4K OLED display, latest-gen processor, 32GB RAM, and all-day battery life in a sleek aluminum chassis weighing just 1.2kg.',
        price: 1899.99,
        categoryName: 'Electronics',
        category: electronics,
        images: [
          'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600',
          'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=600',
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600',
        ],
        rating: 4.9,
        reviewsCount: 567,
        stock: 25,
        specifications: { Brand: 'TechVault', Display: '14" 4K OLED', Processor: 'Intel i9-13th Gen', RAM: '32GB', Storage: '1TB SSD', Weight: '1.2kg' },
      },
      {
        name: 'Smart Watch Series X',
        description: 'Track your fitness goals and stay connected with the Smart Watch Series X. Features include heart rate monitoring, GPS tracking, sleep analysis, and a gorgeous always-on AMOLED display with 5-day battery life.',
        price: 449.99,
        categoryName: 'Electronics',
        category: electronics,
        images: [
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600',
          'https://images.unsplash.com/photo-1546868871-af0de0ae72be?w=600',
        ],
        rating: 4.6,
        reviewsCount: 891,
        stock: 100,
        specifications: { Brand: 'WristTech', Display: '1.9" AMOLED', Battery: '5 days', WaterResistance: '50m', Sensors: 'Heart Rate, SpO2, GPS' },
      },
      {
        name: 'Italian Leather Jacket',
        description: 'Crafted from genuine Italian lambskin leather, this premium jacket combines timeless style with modern tailoring. Features a slim fit design, silk lining, and antique brass hardware.',
        price: 599.99,
        categoryName: 'Fashion',
        category: fashion,
        images: [
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600',
          'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=600',
        ],
        rating: 4.7,
        reviewsCount: 156,
        stock: 30,
        specifications: { Material: 'Italian Lambskin', Fit: 'Slim', Lining: 'Silk', Color: 'Dark Brown' },
      },
      {
        name: 'Designer Silk Dress',
        description: 'Elevate your wardrobe with this stunning silk dress featuring an elegant drape, hidden zipper closure, and hand-finished details. Perfect for cocktail parties and special occasions.',
        price: 349.99,
        categoryName: 'Fashion',
        category: fashion,
        images: [
          'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600',
          'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600',
        ],
        rating: 4.5,
        reviewsCount: 89,
        stock: 40,
        specifications: { Material: '100% Silk', Fit: 'A-Line', Care: 'Dry Clean Only', Color: 'Midnight Blue' },
      },
      {
        name: 'Minimalist Oak Desk',
        description: 'Transform your workspace with this handcrafted solid oak desk. Features clean Scandinavian design, cable management system, and soft-close drawers. Each piece is unique with natural wood grain patterns.',
        price: 799.99,
        categoryName: 'Home & Living',
        category: home,
        images: [
          'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600',
          'https://images.unsplash.com/photo-1611269154421-4e27233ac5c7?w=600',
        ],
        rating: 4.8,
        reviewsCount: 67,
        stock: 15,
        specifications: { Material: 'Solid Oak', Dimensions: '140x70x75cm', Weight: '35kg', Assembly: 'Required' },
      },
      {
        name: 'Luxury Scented Candle Set',
        description: 'Indulge your senses with our luxury candle set. Hand-poured soy wax candles in three signature scents: Vanilla & Sandalwood, Fresh Linen, and Ocean Breeze. Each candle burns for 60+ hours.',
        price: 89.99,
        categoryName: 'Home & Living',
        category: home,
        images: [
          'https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=600',
          'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600',
        ],
        rating: 4.4,
        reviewsCount: 312,
        stock: 200,
        specifications: { Material: 'Soy Wax', BurnTime: '60+ hours each', Scents: '3 included', Weight: '300g each' },
      },
      {
        name: 'Professional Yoga Mat',
        description: 'Elevate your practice with our professional-grade yoga mat. Made from eco-friendly natural rubber with a microfiber suede surface for superior grip. 6mm thick for optimal cushioning.',
        price: 79.99,
        categoryName: 'Sports & Outdoors',
        category: sports,
        images: [
          'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600',
          'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600',
        ],
        rating: 4.6,
        reviewsCount: 445,
        stock: 150,
        specifications: { Material: 'Natural Rubber + Microfiber', Thickness: '6mm', Dimensions: '183x68cm', Weight: '2.5kg' },
      },
      {
        name: 'Premium Skincare Kit',
        description: 'Complete your skincare routine with our premium 5-step kit: Gentle Cleanser, Vitamin C Serum, Hyaluronic Acid Moisturizer, Retinol Night Cream, and SPF 50 Sunscreen. Dermatologist tested.',
        price: 159.99,
        categoryName: 'Beauty & Care',
        category: beauty,
        images: [
          'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600',
          'https://images.unsplash.com/photo-1570194065650-d99fb4a38691?w=600',
        ],
        rating: 4.7,
        reviewsCount: 678,
        stock: 80,
        specifications: { Type: '5-Step Kit', SkinType: 'All Skin Types', Volume: '50ml each', Cruelty: 'Cruelty-Free, Vegan' },
      },
      {
        name: 'Wireless Bluetooth Speaker',
        description: 'Take your music anywhere with this powerful portable Bluetooth speaker. IPX7 waterproof, 20-hour battery life, and 360-degree room-filling sound. Pair two for stereo mode.',
        price: 129.99,
        categoryName: 'Electronics',
        category: electronics,
        images: [
          'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600',
          'https://images.unsplash.com/photo-1589003077984-894e133dabab?w=600',
        ],
        rating: 4.5,
        reviewsCount: 923,
        stock: 120,
        specifications: { Brand: 'SoundWave', Battery: '20 hours', Waterproof: 'IPX7', Connectivity: 'Bluetooth 5.0', Weight: '680g' },
      },
      {
        name: 'Classic Leather Boots',
        description: 'Timeless handcrafted leather boots with Goodyear welt construction. Made from full-grain Italian leather with a leather sole and cushioned insole for all-day comfort.',
        price: 279.99,
        categoryName: 'Fashion',
        category: fashion,
        images: [
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
          'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=600',
        ],
        rating: 4.8,
        reviewsCount: 201,
        stock: 35,
        specifications: { Material: 'Full-Grain Leather', Sole: 'Leather', Construction: 'Goodyear Welt', Color: 'Cognac' },
      },
      {
        name: 'Bestselling Novel Collection',
        description: 'A curated collection of 5 award-winning novels from contemporary authors. Beautifully bound in hardcover with gold foil details. Perfect as a gift or to enhance your personal library.',
        price: 69.99,
        categoryName: 'Books',
        category: books,
        images: [
          'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600',
          'https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=600',
        ],
        rating: 4.9,
        reviewsCount: 1024,
        stock: 300,
        specifications: { Format: 'Hardcover', Pages: '~350 each', Language: 'English', Books: '5 in set' },
      },
    ] as any);

    // ──────────────── ORDERS ────────────────
    const order1 = await this.orderRepo.save({
      user: user1,
      shipping: {
        firstName: 'Jane', lastName: 'Doe',
        address: '123 Main St', city: 'New York', state: 'NY', zipCode: '10001',
      },
      total: 749.98,
      status: 'delivered',
      date: new Date('2026-03-15'),
    } as any);

    await this.orderItemRepo.save([
      { order: order1, product: products[0], quantity: 1, price: 299.99 },
      { order: order1, product: products[3], quantity: 1, price: 449.99 },
    ] as any);

    const order2 = await this.orderRepo.save({
      user: user1,
      shipping: {
        firstName: 'Jane', lastName: 'Doe',
        address: '123 Main St', city: 'New York', state: 'NY', zipCode: '10001',
      },
      total: 1899.99,
      status: 'shipped',
      date: new Date('2026-03-28'),
    } as any);

    await this.orderItemRepo.save([
      { order: order2, product: products[1], quantity: 1, price: 1899.99 },
    ] as any);

    const order3 = await this.orderRepo.save({
      user: user1,
      shipping: {
        firstName: 'Jane', lastName: 'Doe',
        address: '123 Main St', city: 'New York', state: 'NY', zipCode: '10001',
      },
      total: 509.97,
      status: 'processing',
      date: new Date('2026-04-01'),
    } as any);

    await this.orderItemRepo.save([
      { order: order3, product: products[7], quantity: 1, price: 79.99 },
      { order: order3, product: products[8], quantity: 1, price: 159.99 },
      { order: order3, product: products[6], quantity: 3, price: 269.97 },
    ] as any);

    // ──────────────── REVIEWS ────────────────
    await this.reviewRepo.save([
      { user: user1, product: products[0], title: 'Best headphones ever!', rating: 5, comment: 'Crystal clear sound and the noise cancellation is top-notch. Worth every penny.' },
      { user: user2, product: products[0], title: 'Great quality', rating: 4, comment: 'Very comfortable for long listening sessions. Battery lasts forever.' },
      { user: user1, product: products[1], title: 'Incredible laptop', rating: 5, comment: 'The 4K OLED display is breathtaking. Super fast and lightweight.' },
      { user: user2, product: products[3], title: 'Stunning leather', rating: 5, comment: 'The quality of the leather is exceptional. Fits perfectly.' },
      { user: user1, product: products[5], title: 'Beautiful desk', rating: 5, comment: 'Gorgeous natural wood grain. Sturdy and well-built.' },
      { user: user2, product: products[8], title: 'Amazing skincare', rating: 4, comment: 'Noticed visible improvements after just 2 weeks of use.' },
    ] as any);

    // ──────────────── WISHLISTS ────────────────
    await this.wishlistRepo.save([
      { user: user1, product: products[1] },
      { user: user1, product: products[4] },
      { user: user1, product: products[9] },
      { user: user1, product: products[11] },
      { user: user2, product: products[0] },
      { user: user2, product: products[5] },
    ] as any);

    // ──────────────── NOTIFICATIONS ────────────────
    await this.notifRepo.save([
      { user: user1, type: 'order', title: 'Order Delivered', message: 'Your order #' + order1.id.substring(0, 8) + ' has been delivered successfully!', read: true },
      { user: user1, type: 'order', title: 'Order Shipped', message: 'Your order #' + order2.id.substring(0, 8) + ' is on its way!', read: false },
      { user: user1, type: 'promotion', title: 'Flash Sale! 30% Off', message: 'Don\'t miss our weekend flash sale on all Electronics. Use code FLASH30.', read: false },
      { user: user1, type: 'alert', title: 'Price Drop Alert', message: 'An item in your wishlist "Ultra-Slim Laptop Pro" just dropped in price!', read: false },
      { user: user1, type: 'promotion', title: 'New Arrivals', message: 'Check out our latest Spring collection with over 50 new products.', read: false },
      { user: user2, type: 'order', title: 'Welcome!', message: 'Welcome to LuxeStore! Enjoy 15% off your first order with code WELCOME15.', read: false },
      { user: admin, type: 'order', title: 'New Order Placed', message: 'A new order has been placed.', read: false },
    ] as any);

    return {
      message: '✅ Database seeded successfully!',
      summary: {
        users: 3,
        categories: 6,
        products: products.length,
        orders: 3,
        reviews: 6,
        wishlists: 6,
        notifications: 7,
      },
    };
  }
}
