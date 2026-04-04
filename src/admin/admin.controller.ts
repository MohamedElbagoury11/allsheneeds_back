import { Controller, Get, Body, Param, Patch, Query, UseGuards, Delete, Post } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { OrdersService } from '../orders/orders.service';
import { NotificationsService } from '../notifications/notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

import { CategoriesService } from '../categories/categories.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly ordersService: OrdersService,
    private readonly notificationsService: NotificationsService,
    private readonly categoriesService: CategoriesService,
  ) {}


  @Post('sync-categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async syncCategories() {
    return this.categoriesService.syncProductLinks();
  }

  @Get('analytics/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getSummary() {
    return this.analyticsService.getSummary();
  }

  @Get('analytics/revenue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getRevenueHistory(@Query('period') period: string) {
    return this.analyticsService.getRevenueHistory(period || '7d');
  }

  @Get('analytics/orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getOrdersHistory(@Query('period') period: string) {
    return this.analyticsService.getOrdersHistory(period || '7d');
  }

  @Get('analytics/top-products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  getTopProducts(@Query('limit') limit: string) {
    return this.analyticsService.getTopProducts(Number(limit) || 5);
  }

  @Get('analytics/all-orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async findAllOrders() {
    const orders = await this.ordersService.findAll();
    return orders.map(o => this.mapOrder(o));
  }

  @Patch('analytics/orders/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updateOrderStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.ordersService.update(id, { status });
  }

  @Delete('analytics/orders/:orderId/items/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async removeOrderItem(@Param('orderId') orderId: string, @Param('productId') productId: string) {
    const order = await this.ordersService.removeOrderItem(orderId, productId);
    return this.mapOrder(order);
  }

  @Patch('analytics/orders/:orderId/items/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updateOrderItemQuantity(
    @Param('orderId') orderId: string, 
    @Param('productId') productId: string,
    @Body('quantity') quantity: number
  ) {
    const order = await this.ordersService.updateOrderItemQuantity(orderId, productId, quantity);
    return this.mapOrder(order);
  }

  private mapOrder(o: any) {
    if (!o) return null;
    const items = o.items || [];
    return {
      id: o.id?.toString() || '',
      date: o.date ? new Date(o.date).toISOString() : new Date().toISOString(),
      total: Number(o.total) || 0,
      status: o.status || 'processing',
      itemsCount: items.length,
      customerName: o.user?.name || 'Guest',
      shipping: o.shipping || {},
      items: items.map((item: any) => ({
        productId: item.product?.id || item.productId || 'deleted',
        name: item.product?.name || item.productName || 'Product',
        categoryName: item.product?.categoryName || item.categoryName || 'N/A',
        quantity: Number(item.quantity) || 0,
        price: Number(item.price) || 0,
      })),
    };
  }

  @Get('analytics/notifications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async findAllNotifications() {
    const notifications = await this.notificationsService.findAll();
    return notifications.map(n => ({
      id: n.id,
      type: n.type || 'alert',
      title: n.title || 'Notification',
      message: n.message,
      time: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
      read: n.read || false,
    }));
  }
}
