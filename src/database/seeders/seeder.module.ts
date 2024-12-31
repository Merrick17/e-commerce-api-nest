import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommandModule } from 'nestjs-command';

import { User, UserSchema } from '../../users/schemas/user.schema';
import { Category, CategorySchema } from '../../categories/schemas/category.schema';
import { Product, ProductSchema } from '../../products/schemas/product.schema';
import { PromoCode, PromoCodeSchema } from '../../promo-codes/schemas/promo-code.schema';
import { Promotion, PromotionSchema } from '../../promotions/schemas/promotion.schema';
import { SeederService } from './seeder.service';
import { SeedCommand } from './seed.command';

@Module({
  imports: [
    CommandModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
      { name: PromoCode.name, schema: PromoCodeSchema },
      { name: Promotion.name, schema: PromotionSchema },
    ]),
  ],
  providers: [SeederService, SeedCommand],
  exports: [SeederService],
})
export class SeederModule {} 