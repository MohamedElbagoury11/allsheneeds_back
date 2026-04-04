import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, IsNull } from 'typeorm';
import { Category } from '../entities/category.entity';
import { Product } from '../entities/product.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createCategoryDto: DeepPartial<Category>): Promise<Category> {
    const category = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(category);
  }

  async findAll(): Promise<any[]> {
    const categories = await this.categoryRepository.find();
    
    // For each category, count products where categoryId matches or categoryName matches
    const categoriesWithCount = await Promise.all(categories.map(async (c) => {
      // Use query builder for more precise matching (case-insensitive and trimmed if needed)
      const count = await this.productRepository.createQueryBuilder('product')
        .where('product.categoryId = :id', { id: c.id })
        .orWhere('LOWER(TRIM(product.categoryName)) = LOWER(TRIM(:name))', { name: c.name })
        .getCount();
        
      return { ...c, count };
    }));
    
    return categoriesWithCount;
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({ 
      where: { id },
      relations: ['products'] 
    });
    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }
    return category;
  }

  async update(id: string, updateCategoryDto: any): Promise<Category> {
    const category = await this.findOne(id);
    this.categoryRepository.merge(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepository.remove(category);
  }

  async syncProductLinks(): Promise<any> {
    const categories = await this.categoryRepository.find();
    let updatedCount = 0;
    
    for (const cat of categories) {
      const products = await this.productRepository.find({
        where: { categoryName: cat.name, category: IsNull() }
      });
      
      for (const prod of products) {
        prod.category = cat;
        await this.productRepository.save(prod);
        updatedCount++;
      }
    }
    
    return { success: true, updatedCount };
  }
}
