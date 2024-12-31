import { Type } from 'class-transformer';
import { 
  IsArray, 
  IsMongoId, 
  IsNotEmpty, 
  IsNumber, 
  IsOptional, 
  IsString, 
  Min, 
  ValidateNested,
  IsEnum,
  MinLength,
  IsPhoneNumber 
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card'
}

class OrderProductDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'The product ID',
  })
  @IsMongoId()
  product: string;

  @ApiProperty({
    example: 2,
    description: 'The quantity of the product',
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity: number;
}

class ShippingDetailsDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the recipient',
  })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiProperty({
    example: '+21612345678',
    description: 'Phone number',
  })
  @IsPhoneNumber()
  phone: string;

  @ApiProperty({
    example: '123 Main St',
    description: 'Shipping address',
  })
  @IsString()
  @MinLength(5)
  address: string;

  @ApiProperty({
    example: 'Tunis',
    description: 'City',
  })
  @IsString()
  @MinLength(2)
  city: string;

  @ApiProperty({
    example: 'Tunis',
    description: 'State/Region',
  })
  @IsString()
  @MinLength(2)
  state: string;

  @ApiProperty({
    example: '1000',
    description: 'Zip/Postal code',
  })
  @IsString()
  @MinLength(4)
  zipCode: string;
}

class PaymentDetailsDto {
  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.CASH,
    description: 'Payment method',
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    example: '4242424242424242',
    description: 'Card number (required if payment method is card)',
  })
  @IsOptional()
  @IsString()
  cardNumber?: string;

  @ApiPropertyOptional({
    example: '12/25',
    description: 'Card expiry date (required if payment method is card)',
  })
  @IsOptional()
  @IsString()
  expiryDate?: string;

  @ApiPropertyOptional({
    example: '123',
    description: 'Card CVV (required if payment method is card)',
  })
  @IsOptional()
  @IsString()
  cvv?: string;
}

export class CreateOrderDto {
  @ApiProperty({
    type: [OrderProductDto],
    description: 'Array of products in the order',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderProductDto)
  products: OrderProductDto[];

  @ApiProperty({
    type: ShippingDetailsDto,
    description: 'Shipping details',
  })
  @ValidateNested()
  @Type(() => ShippingDetailsDto)
  shippingDetails: ShippingDetailsDto;

  @ApiProperty({
    type: PaymentDetailsDto,
    description: 'Payment details',
  })
  @ValidateNested()
  @Type(() => PaymentDetailsDto)
  paymentDetails: PaymentDetailsDto;

  @ApiPropertyOptional({
    example: 'SUMMER2023',
    description: 'Promo code to apply to the order',
  })
  @IsOptional()
  @IsString()
  promoCode?: string;
} 