import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { CommandModule } from 'nestjs-command';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { PromotionsModule } from './promotions/promotions.module';
import { PromoCodesModule } from './promo-codes/promo-codes.module';
import { OrdersModule } from './orders/orders.module';
import { getMongoConfig } from './config/mongoose.config';
import { SeederModule } from './database/seeders/seeder.module';
import { StatisticsModule } from './statistics/statistics.module';
import { StoreConfigModule } from './store-config/store-config.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getMongoConfig,
      inject: [ConfigService],
    }),
    CommandModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    ProductsModule,
    PromotionsModule,
    PromoCodesModule,
    OrdersModule,
    SeederModule,
    StatisticsModule,
    StoreConfigModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
