import { Controller, Get, Post, Body, Param, Query, Put, Delete, UseGuards } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from '../entities/product.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateProductDto } from './dto/create-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(
    @Query('category') category?: string,
    @Query('sort') sort?: string,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
  ) {
    let products = await this.productsService.findAll();
    
    if (category) {
      const catLower = category.trim().toLowerCase();
      products = products.filter(p => 
        (p.category?.name?.trim()?.toLowerCase() === catLower) || 
        (p.categoryName?.trim()?.toLowerCase() === catLower)
      );
    }

    if (search) {
      const searchWords = search.trim().toLowerCase().split(/\s+/);
      products = products.filter(p => {
        const name = (p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const catName = (p.category?.name || p.categoryName || '').toLowerCase();
        const combined = `${name} ${desc} ${catName}`;
        
        // Match all words in the search query for better precision
        return searchWords.every(word => combined.includes(word));
      });
    }

    if (minPrice) {
      products = products.filter(p => Number(p.price) >= Number(minPrice));
    }

    if (maxPrice) {
      products = products.filter(p => Number(p.price) <= Number(maxPrice));
    }
    
    if (sort === 'price-asc') {
      products.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === 'price-desc') {
      products.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sort === 'newest') {
      products.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA === timeB) {
          // Fallback to ID for stable sorting if timestamps match or are missing
          return (b.id || '').localeCompare(a.id || '');
        }
        return timeB - timeA;
      });
    } else if (sort === 'rating') {
      products.sort((a, b) => Number(b.rating) - Number(a.rating));
    }

    if (limit) {
      products = products.slice(0, Number(limit));
    }
    
    return products.map(this.mapProduct);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const product = await this.productsService.findOne(id);
    return this.mapProduct(product);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async create(@Body() createProductDto: CreateProductDto) {
    const product = await this.productsService.create(createProductDto as any);
    return this.mapProduct(product);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async update(@Param('id') id: string, @Body() updateProductDto: any) {
    const product = await this.productsService.update(id, updateProductDto);
    return this.mapProduct(product);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string) {
    await this.productsService.remove(id);
    return { success: true };
  }

  // Create mock mapping function
  private mapProduct(p: Product) {
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price) || 0,
      discountPrice: (p.discountPrice !== null && p.discountPrice !== undefined) ? Number(p.discountPrice) : undefined,
      onSale: !!p.onSale,
      category: p.category?.name || p.categoryName || '',
      images: Array.isArray(p.images) ? p.images : [],
      rating: Number(p.rating) || 0,
      reviewsCount: p.reviewsCount || 0,
      stock: p.stock || 0,
      specifications: p.specifications || {},
      createdAt: p.createdAt,
    };
  }
}