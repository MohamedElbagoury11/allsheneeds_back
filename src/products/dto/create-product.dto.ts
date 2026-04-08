import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsBoolean,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsOptional()
  @IsString()
  nameEn?: string;

  @IsOptional()
  @IsString()
  nameAr?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description: string;

  @IsOptional()
  @IsString()
  descriptionEn?: string;

  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @IsNumber({}, { message: 'Price must be a number' })
  @Min(0.01, { message: 'Price must be greater than 0' })
  price: number;

  @IsOptional()
  @IsNumber({}, { message: 'Discount price must be a number' })
  @Min(0, { message: 'Discount price must be greater than or equal to 0' })
  discountPrice?: number;

  @IsOptional()
  @IsBoolean()
  onSale?: boolean;

  @IsString()
  @IsNotEmpty()
  categoryName: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsObject()
  specifications?: Record<string, unknown>;
}
