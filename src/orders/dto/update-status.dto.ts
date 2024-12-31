import { IsEnum } from 'class-validator';
import { OrderStatus } from '../schemas/order.schema';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStatusDto {
  @ApiProperty({
    enum: OrderStatus,
    example: OrderStatus.PROCESSING,
    description: 'The new status of the order',
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;
} 