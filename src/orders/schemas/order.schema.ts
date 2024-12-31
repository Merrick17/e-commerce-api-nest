import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Product } from '../../products/schemas/product.schema';
import { PaymentMethod } from '../dto/create-order.dto';

export enum OrderStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

class ShippingDetails {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  zipCode: string;
}

class PaymentDetails {
  @Prop({ type: String, enum: PaymentMethod, required: true })
  paymentMethod: PaymentMethod;

  @Prop()
  cardNumber?: string;

  @Prop()
  expiryDate?: string;
}

@Schema({
  timestamps: true,
  toJSON: {
    transform: (_, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
})
export class Order extends Document {
  @Prop([{
    product: { type: MongooseSchema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
  }])
  products: Array<{
    product: Product;
    quantity: number;
    price: number;
  }>;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  orderCreator: User;

  @Prop({ type: ShippingDetails, required: true })
  shippingDetails: ShippingDetails;

  @Prop({ type: PaymentDetails, required: true })
  paymentDetails: PaymentDetails;

  @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Prop({ required: true, type: Number })
  subtotal: number;

  @Prop({ type: Number, default: 0 })
  promoDiscount: number;

  @Prop({ required: true, type: Number })
  VAT: number;

  @Prop({ required: true, type: Number })
  total: number;
}

export const OrderSchema = SchemaFactory.createForClass(Order); 