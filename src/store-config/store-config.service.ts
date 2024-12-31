import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StoreConfig } from './schemas/store-config.schema';
import { UpdateStoreConfigDto } from './dto/update-store-config.dto';

@Injectable()
export class StoreConfigService implements OnModuleInit {
  constructor(
    @InjectModel(StoreConfig.name) private readonly storeConfigModel: Model<StoreConfig>,
  ) {}

  async onModuleInit() {
    await this.ensureConfigExists();
  }

  private async ensureConfigExists() {
    try {
      const count = await this.storeConfigModel.countDocuments();
      if (count === 0) {
        await this.storeConfigModel.create({
          storeName: 'My E-commerce Store',
          seoDescription: 'Welcome to our online store',
        });
      }
    } catch (error) {
      // Log error but don't throw during initialization
      console.warn('Failed to initialize store config:', error.message);
    }
  }

  async getConfig() {
    const config = await this.storeConfigModel.findOne();
    if (!config) {
      throw new NotFoundException('Store configuration not found');
    }
    return config;
  }

  async updateConfig(updateStoreConfigDto: UpdateStoreConfigDto) {
    const config = await this.storeConfigModel.findOne();
    if (!config) {
      throw new NotFoundException('Store configuration not found');
    }

    Object.assign(config, updateStoreConfigDto);
    return config.save();
  }
} 