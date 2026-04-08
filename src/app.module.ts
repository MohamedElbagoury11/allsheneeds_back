import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Entities
import { User } from './entities/user.entity';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product_variant.entity';
import { ProductImage } from './entities/product_image.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order_item.entity';
import { Review } from './entities/review.entity';
import { Wishlist } from './entities/wishlist.entity';
import { Notification } from './entities/notification.entity';

// Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { OrdersModule } from './orders/orders.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ReviewsModule } from './reviews/reviews.module';
import { WishlistsModule } from './wishlists/wishlists.module';
import { AdminModule } from './admin/admin.module';
import { SeedController } from './seed.controller';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    // ── Config (must be first) ──────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // ── Rate Limiting (global — 100 req / 60 sec per IP) ────────
    ThrottlerModule.forRoot([
      {
        ttl: 60000,  // 60 seconds window
        limit: 100,  // max requests per window
      },
    ]),

    // ── Database ────────────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get<string>('DB_USERNAME', 'root'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_NAME', 'mystore_db'),
        synchronize:true,
        ssl:{
      rejectUnauthorized: false,
    },
        connectTimeout: 10000,
        entities: [
          User,
          Category,
          Product,
          ProductVariant,
          ProductImage,
          Order,
          OrderItem,
          Review,
          Wishlist,
          Notification,
        ],
        // Set to false in production and use migrations instead
     //   synchronize: config.get<string>('NODE_ENV') !== 'production',
      }),
  
      inject: [ConfigService],
    }),

    // Feature entities available globally
    TypeOrmModule.forFeature([
      User,
      Category,
      Product,
      ProductVariant,
      ProductImage,
      Order,
      OrderItem,
      Review,
      Wishlist,
      Notification,
    ]),

    // ── App Modules ─────────────────────────────────────────────
    AuthModule,
    UsersModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    NotificationsModule,
    ReviewsModule,
    WishlistsModule,
    AdminModule,
    CloudinaryModule,
    UploadModule,
  ],
  controllers: [AppController, SeedController],
  providers: [
    AppService,
    // Apply rate limiting globally to all routes
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
