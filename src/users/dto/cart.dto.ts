import { IsMongoId, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Product ID to add to cart',
  })
  @IsMongoId()
  productId: string;

  @ApiProperty({
    example: 1,
    description: 'Quantity of the product',
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class UpdateCartQuantityDto {
  @ApiProperty({
    example: 2,
    description: 'New quantity of the product',
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity: number;
} 