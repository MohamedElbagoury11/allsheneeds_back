import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async create(createNotificationDto: DeepPartial<Notification>): Promise<Notification> {
    const notification = this.notificationRepository.create(createNotificationDto);
    return this.notificationRepository.save(notification);
  }

  async findAll(): Promise<Notification[]> {
    return this.notificationRepository.find({ relations: ['user'] });
  }

  async findOne(id: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    return notification;
  }

  async update(id: number, updateNotificationDto: any): Promise<Notification> {
    const notification = await this.findOne(id);
    this.notificationRepository.merge(notification, updateNotificationDto);
    return this.notificationRepository.save(notification);
  }

  async remove(id: number): Promise<void> {
    const notification = await this.findOne(id);
    await this.notificationRepository.remove(notification);
  }
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update({ user: { id: userId } as any }, { read: true });
  }
}
