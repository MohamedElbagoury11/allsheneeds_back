import { Controller, Get, UseGuards, Request, Param, Patch } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Notification } from '../entities/notification.entity';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(@Request() req) {
    const notifications = await this.notificationsService.findAll();
    const userNotifs = notifications.filter(n => n.user?.id === req.user.userId);
    
    return userNotifs.map(this.mapNotification);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async findAllAdmin() {
    const notifications = await this.notificationsService.findAll();
    // Return all notifications for admin, or filter by admin role if needed
    // For now, let's return all and map them
    return notifications.map(this.mapNotification);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.update(Number(id), { read: true });
  }

  private mapNotification(n: Notification) {
    return {
      id: n.id,
      type: n.type || 'alert',
      title: n.title || 'Notification',
      message: n.message,
      time: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
      read: n.read || false,
    };
  }
}
