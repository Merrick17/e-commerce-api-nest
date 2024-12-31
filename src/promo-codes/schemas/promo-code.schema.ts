import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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
export class PromoCode extends Document {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ required: true, min: 0, max: 100 })
  percentage: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  expiryDate: Date;
}

export const PromoCodeSchema = SchemaFactory.createForClass(PromoCode); 