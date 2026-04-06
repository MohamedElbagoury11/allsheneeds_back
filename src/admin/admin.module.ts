import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AdminController } from './admin.controller';
import { AnalyticsController } from './analytics.controller';
import { Order } from '../entities/order.entity';
import { Product } from '../entities/product.entity';
import { User } from '../entities/user.entity';
import { Category } from '../entities/category.entity';
import { OrderItem } from '../entities/order_item.entity';
import { OrdersModule } from '../orders/orders.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CategoriesModule } from '../categories/categories.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, Product, User, Category, OrderItem]),
    OrdersModule,
    NotificationsModule,
    CategoriesModule,
    UsersModule,
  ],
  controllers: [AdminController, AnalyticsController],
  providers: [AnalyticsService],
})
export class AdminModule {}
