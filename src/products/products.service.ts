import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product_variant.entity';
import { ProductImage } from '../entities/product_image.entity';
import { Category } from '../entities/category.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductImage)
    private readonly imageRepository: Repository<ProductImage>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createProductDto: any): Promise<Product> {
    try {
      const { categoryName: catName, ...rest } = createProductDto;

      if (rest.nameEn) rest.name = rest.nameEn;
      if (rest.descriptionEn) rest.description = rest.descriptionEn;
      
      const newProduct = this.productRepository.create(rest as DeepPartial<Product>);
      
      if (catName) {
        const category = await this.categoryRepository.findOne({ where: { name: catName } });
        if (category) {
          newProduct.category = category;
          newProduct.categoryName = category.name;
        }
      }
      
      return await this.productRepository.save(newProduct);
    } catch (error) {
      console.error('FAILED TO CREATE PRODUCT:', error);
      throw error;
    }
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find({
      relations: ['category', 'variants', 'imageRelations', 'reviews'],
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'variants', 'imageRelations', 'reviews'],
    });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async update(id: string, updateProductDto: any): Promise<Product> {
    const product = await this.findOne(id);
    const { categoryName: catName, ...rest } = updateProductDto;

    if (rest.nameEn) rest.name = rest.nameEn;
    if (rest.descriptionEn) rest.description = rest.descriptionEn;
    
    this.productRepository.merge(product, rest as DeepPartial<Product>);

    if (catName) {
      const category = await this.categoryRepository.findOne({ where: { name: catName } });
      if (category) {
        product.category = category;
        product.categoryName = category.name;
      }
    }

    return this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.softRemove(product);
  }
}
