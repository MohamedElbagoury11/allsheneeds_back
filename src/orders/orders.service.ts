import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order } from '../entities/order.entity';
import { OrderItem } from '../entities/order_item.entity';
import { User } from '../entities/user.entity';
import { Notification } from '../entities/notification.entity';
import { Product } from '../entities/product.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createOrderDto: any): Promise<Order> {
    const { items, ...orderData } = createOrderDto;

    // 1. Save the Order first
    const order = this.orderRepository.create(orderData as any) as unknown as Order;
    const savedOrder = await this.orderRepository.save(order);

    // 2. Save the Items with product prices fetched from DB
    if (items && items.length > 0) {
      // Collect all product IDs
      const productIds = items.map(
        (item: any) => item.productId || item.product_id || item.product?.id,
      ).filter(Boolean);

      // Fetch all products in one query
      const products = await this.productRepository.find({
        where: { id: In(productIds) },
      });
      const productMap = new Map(products.map(p => [p.id, p]));

      const orderItems = items.map((item: any) => {
        const pid = item.productId || item.product_id || item.product?.id;
        const product = productMap.get(pid);
        if (!product) {
          return null;
        }
        if (product.stock <= 0) {
          throw new BadRequestException(`Product out of stock`);
        }
        return this.orderItemRepository.create({
          order: savedOrder,
          product: product,
          quantity: item.quantity,
          price: product.price,
        });
      }).filter(Boolean);

      if (orderItems.length > 0) {
        await this.orderItemRepository.save(orderItems);
      }
    }

    // 3. Create notifications for admins
    const admins = await this.userRepository.find({ where: { role: 'admin' } });
    const notifications = admins.map(admin => ({
      user: admin,
      type: 'order',
      title: 'New Order Placed',
      message: `A new order ${savedOrder.id} for $${savedOrder.total} has been placed.`,
    }));
    
    if (notifications.length > 0) {
      await this.notificationRepository.save(notifications);
    }

    // Return the full order with items
    return this.findOne(savedOrder.id);
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({
      relations: {
        user: true,
        items: {
          product: true
        }
      }
    });
  }

  async findByUser(userId: string): Promise<Order[]> {
    return this.orderRepository.find({
      where: { user: { id: userId } },
      relations: {
        user: true,
        items: {
          product: true
        }
      }
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: {
        user: true,
        items: {
          product: true
        }
      }
    });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async update(id: string, updateOrderDto: any): Promise<Order> {
    const order = await this.findOne(id);
    const previousStatus = order.status;
    // Capture items with product data BEFORE merge overwrites them
    const itemsSnapshot = order.items ? [...order.items] : [];

    this.orderRepository.merge(order, updateOrderDto);
    const savedOrder = await this.orderRepository.save(order);

    // Decrement stock when order transitions to 'shipped' (only once)
    if (updateOrderDto.status === 'shipped' && previousStatus !== 'shipped') {
      for (const item of itemsSnapshot) {
        const productId = item.product?.id;
        const qty = Number(item.quantity) || 1;
        if (productId) {
          await this.productRepository.decrement({ id: productId }, 'stock', qty);
        }
      }
    }

    // Notify user of status change
    if (updateOrderDto.status && updateOrderDto.status !== previousStatus) {
      if (order.user) {
        const notification = this.notificationRepository.create({
          user: order.user,
          type: 'order_status',
          title: 'Order Status Updated',
          message: `Your order ${order.id} status has been updated to ${updateOrderDto.status}.`
        });
        await this.notificationRepository.save(notification);
      }
    }

    return savedOrder;
  }

  async remove(id: string): Promise<void> {
    const order = await this.findOne(id);
    await this.orderRepository.remove(order);
  }

  async removeOrderItem(orderId: string, productId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product', 'user'],
    });

    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    const itemIndex = order.items.findIndex(item => item.product?.id === productId);
    if (itemIndex === -1) throw new NotFoundException(`Product ${productId} not found in order ${orderId}`);

    const itemToRemove = order.items[itemIndex];
    
    // Update total
    order.total = Number(order.total) - (Number(itemToRemove.price) * Number(itemToRemove.quantity));
    
    // Remove from array and DB
    await this.orderItemRepository.remove(itemToRemove);
    order.items.splice(itemIndex, 1);

    // If no items left, cancel the order or keep it as empty? Let's just update total.
    return this.orderRepository.save(order);
  }

  async updateOrderItemQuantity(orderId: string, productId: string, quantity: number): Promise<Order> {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new BadRequestException('Quantity must be a positive integer (minimum 1)');
    }

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: {
        user: true,
        items: {
          product: true
        }
      }
    });

    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    const item = order.items.find(item => item.product?.id === productId);
    if (!item) throw new NotFoundException(`Product ${productId} not found in order ${orderId}`);

    item.quantity = quantity;
    await this.orderItemRepository.save(item);

    // Recalculate total
    const newTotal = order.items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0);
    order.total = newTotal;

    return this.orderRepository.save(order);
  }
}
