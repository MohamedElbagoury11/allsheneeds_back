import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { WishlistsService } from './wishlists.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Product } from '../entities/product.entity';

@Controller('wishlists')
@UseGuards(JwtAuthGuard)
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}

  @Get()
  async findAll(@Request() req) {
    const wishlists = await this.wishlistsService.findAll();
    const userWishlists = wishlists.filter(w => w.user?.id === req.user.userId);
    
    // Extract products
    return userWishlists.map(w => {
      const p = w.product;
      if (!p) return null;
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        price: Number(p.price) || 0,
        category: p.category?.name || p.categoryName || '',
        images: Array.isArray(p.images) ? p.images : [],
        rating: Number(p.rating) || 0,
        reviewsCount: p.reviewsCount || 0,
        stock: p.stock || 0,
        specifications: p.specifications || {},
      };
    }).filter(x => x !== null);
  }

  @Post()
  async create(@Request() req, @Body() body: { productId: string }) {
    return this.wishlistsService.create({
      user: { id: req.user.userId } as any,
      product: { id: body.productId } as any,
    });
  }

  @Delete(':productId')
  async remove(@Request() req, @Param('productId') productId: string) {
    const wishlists = await this.wishlistsService.findAll();
    const item = wishlists.find(w => w.user?.id === req.user.userId && w.product?.id === productId);
    if (item) {
      return this.wishlistsService.remove(item.id);
    }
    return { success: true };
  }
}
