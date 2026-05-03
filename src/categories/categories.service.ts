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

  async create(createCategoryDto: any): Promise<Category> {
    if (createCategoryDto.nameEn) createCategoryDto.name = createCategoryDto.nameEn;
    const category = this.categoryRepository.create(createCategoryDto as DeepPartial<Category>);
    return this.categoryRepository.save(category);
  }

  async findAll(includeOutOfStock: boolean = false): Promise<any[]> {
    const categories = await this.categoryRepository.find();
    
    // For each category, count products where categoryId matches or categoryName matches
    const categoriesWithCount = await Promise.all(categories.map(async (c) => {
      // Use query builder for more precise matching (case-insensitive and trimmed if needed)
      const query = this.productRepository.createQueryBuilder('product')
        .where('(product.categoryId = :id OR LOWER(TRIM(product.categoryName)) = LOWER(TRIM(:name)))', { id: c.id, name: c.name });
      
      if (!includeOutOfStock) {
        query.andWhere('product.stock > 0');
      }
      
      const count = await query.getCount();
        
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
    if (updateCategoryDto.nameEn) updateCategoryDto.name = updateCategoryDto.nameEn;
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
