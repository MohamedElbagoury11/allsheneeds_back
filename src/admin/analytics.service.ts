import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order } from '../entities/order.entity';
import { Product } from '../entities/product.entity';
import { User } from '../entities/user.entity';
import { Category } from '../entities/category.entity';

import { OrderItem } from '../entities/order_item.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}

  async getSummary() {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [totalOrders, totalProducts, totalUsers, currentOrders, lastMonthOrders] = await Promise.all([
      this.orderRepository.count(),
      this.productRepository.count(),
      this.userRepository.count(),
      this.orderRepository.find({ where: { date: Between(firstDayOfMonth, now) } }),
      this.orderRepository.find({ where: { date: Between(firstDayOfLastMonth, firstDayOfMonth) } }),
    ]);

    const totalRevenue = (await this.orderRepository.find()).reduce((sum, o) => sum + Number(o.total), 0);
    
    // Calculate trends
    const currentRevenue = currentOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + Number(o.total), 0);
    
    const revenueTrend = lastMonthRevenue === 0 ? 100 : Math.round(((currentRevenue - lastMonthRevenue) / lastMonthRevenue) * 100);
    const ordersTrend = lastMonthOrders.length === 0 ? 100 : Math.round(((currentOrders.length - lastMonthOrders.length) / lastMonthOrders.length) * 100);

    return {
      totalRevenue,
      totalOrders,
      totalProducts,
      totalUsers,
      revenueTrend,
      ordersTrend,
    };
  }

  async getRevenueHistory(period: string) {
    const days = period === '30d' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await this.orderRepository.find({
      where: {
        date: Between(startDate, new Date()),
      },
    });

    const history = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      history[dateStr] = 0;
    }

    orders.forEach(order => {
      const dateStr = new Date(order.date).toISOString().split('T')[0];
      if (history[dateStr] !== undefined) {
        history[dateStr] += Number(order.total);
      }
    });

    return Object.keys(history)
      .map(date => ({ date, revenue: history[date] }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getOrdersHistory(period: string) {
    const days = period === '30d' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await this.orderRepository.find({
      where: {
        date: Between(startDate, new Date()),
      },
    });

    const history = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      history[dateStr] = 0;
    }

    orders.forEach(order => {
      const dateStr = new Date(order.date).toISOString().split('T')[0];
      if (history[dateStr] !== undefined) {
        history[dateStr] += 1;
      }
    });

    return Object.keys(history)
      .map(date => ({ date, count: history[date] }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getTopProducts(limit: number) {
    const items = await this.orderItemRepository.find({
      relations: ['product'],
    });

    const productStats = {};
    items.forEach(item => {
      if (!item.product) return;
      const pid = item.product.id;
      if (!productStats[pid]) {
        productStats[pid] = {
          id: pid,
          name: item.product.name,
          image: Array.isArray(item.product.images) && item.product.images.length > 0 ? item.product.images[0] : '',
          totalSold: 0,
          revenue: 0,
        };
      }
      productStats[pid].totalSold += Number(item.quantity);
      productStats[pid].revenue += Number(item.price) * Number(item.quantity);
    });

    return Object.values(productStats)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, limit);
  }
}
