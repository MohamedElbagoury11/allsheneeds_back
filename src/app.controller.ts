import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test-route')
  testRoute(): string {
    return 'Backend is alive and reflecting new changes!';
  }
  @Get('health')
  health(): string {
    return 'Backend is healthy!';
  }

  @Get('db-status')
  async getDbStatus() {
    return {
      host: process.env.DB_HOST || 'localhost (fallback)',
      env: process.env.NODE_ENV || 'not set',
      port: process.env.DB_PORT || '3306 (fallback)',
    };
  }
}
