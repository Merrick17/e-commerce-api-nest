import { IsNotEmpty, IsString, IsNumber, Min, Max, IsOptional, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePromoCodeDto {
  @ApiProperty({
    example: 'SUMMER2023',
    description: 'The promo code',
  })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({
    example: 20,
    description: 'The discount percentage',
    minimum: 0,
    maximum: 100,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the promo code is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: '2024-12-31T23:59:59Z',
    description: 'The expiry date of the promo code',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiryDate?: Date;
} 