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
export class StoreConfig extends Document {
  @Prop({ required: true })
  storeName: string;

  @Prop()
  logoUrl: string;

  @Prop()
  bannerUrl: string;

  @Prop()
  seoDescription: string;

  @Prop()
  seoKeywords: string;

  @Prop({ default: true })
  isMaintenanceMode: boolean;

  @Prop({ type: Object, default: {} })
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };

  @Prop({ type: Object, default: {} })
  contactInfo: {
    email?: string;
    phone?: string;
    address?: string;
  };

  @Prop({ type: Object, default: {} })
  appearance: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
  };
}

export const StoreConfigSchema = SchemaFactory.createForClass(StoreConfig); 