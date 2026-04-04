import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsString,
  Min,
  ValidateNested,
  ArrayMinSize,
  IsInt,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt({ message: 'Quantity must be a whole number' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'Order must have at least one item' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsNumber({}, { message: 'Total must be a number' })
  @Min(0)
  total: number;

  @IsOptional()
  @IsObject()
  shipping?: Record<string, unknown>;
}
