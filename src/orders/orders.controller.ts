import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  Patch,
  ForbiddenException,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  async create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    // Map items to include proper product relation structure
    const items = createOrderDto.items.map((item) => ({
      ...item,
      product: { id: item.productId },
    }));

    const orderData = {
      ...createOrderDto,
      items,
      user: { id: req.user.userId },
      date: new Date(),
    };
    return this.ordersService.create(orderData);
  }

  @Get()
  async findAll(@Request() req) {
    const orders = await this.ordersService.findByUser(req.user.userId);
    return orders.map(this.mapOrder);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async findAllAdmin() {
    const orders = await this.ordersService.findAll();
    return orders.map(this.mapOrder);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const order = await this.ordersService.findOne(id);

    // IDOR fix: regular users can only see their own orders
    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && order.user?.id !== req.user.userId) {
      throw new ForbiddenException('You do not have access to this order');
    }

    return this.mapOrder(order);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.ordersService.update(id, { status });
  }

  private mapOrder(o: any) {
    return {
      id: o.id.toString(),
      date: o.date ? new Date(o.date).toISOString() : new Date().toISOString(),
      total: Number(o.total) || 0,
      status: o.status || 'processing',
      itemsCount: o.items?.length || 0,
      customerName: o.user?.name || 'Guest',
      shipping: o.shipping || {},
      items:
        o.items?.map((item: any) => ({
          productId: item.product?.id,
          name: item.product?.name,
          nameAr: item.product?.nameAr || item.product?.name,
          nameEn: item.product?.nameEn || item.product?.name,
          images: item.product?.images || [],
          quantity: Number(item.quantity) || 1,
          price: Number(item.price) || 0,
        })) || [],
    };
  }
}
