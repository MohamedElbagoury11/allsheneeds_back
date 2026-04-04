import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  getSummary() {
    return this.analyticsService.getSummary();
  }

  @Get('revenue')
  getRevenueHistory(@Query('period') period: string) {
    return this.analyticsService.getRevenueHistory(period || '7d');
  }

  @Get('orders')
  getOrdersHistory(@Query('period') period: string) {
    return this.analyticsService.getOrdersHistory(period || '7d');
  }

  @Get('top-products')
  getTopProducts(@Query('limit') limit: string) {
    return this.analyticsService.getTopProducts(Number(limit) || 5);
  }
}
