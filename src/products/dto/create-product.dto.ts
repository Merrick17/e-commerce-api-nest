import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    example: 'iPhone 13',
    description: 'The name of the product',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 'The latest iPhone with amazing features...',
    description: 'Detailed description of the product',
  })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'The category ID of the product',
  })
  @IsNotEmpty()
  @IsMongoId()
  category: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the product is in stock',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isOnStock?: boolean;

  @ApiProperty({
    example: 899.99,
    description: 'The buying price of the product',
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  buyPrice: number;

  @ApiProperty({
    example: 999.99,
    description: 'The selling price of the product',
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  sellPrice: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the product is on flash sale',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isOnFlash?: boolean;

  @ApiPropertyOptional({
    example: 799.99,
    description: 'The flash sale price of the product',
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  flashPrice?: number;

  @ApiProperty({ type: 'string', format: 'binary' })
  mainImage: any;

  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  images?: any[];

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the product is featured',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
} 