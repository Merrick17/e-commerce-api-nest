import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import { Promotion } from './schemas/promotion.schema';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class PromotionsService {
  constructor(
    @InjectModel(Promotion.name) private readonly promotionModel: Model<Promotion>,
  ) {}

  async create(createPromotionDto: CreatePromotionDto): Promise<Promotion> {
    const createdPromotion = new this.promotionModel(createPromotionDto);
    return createdPromotion.save();
  }

  async findAll(paginationDto: PaginationDto): Promise<{
    data: Promotion[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page, limit, search } = paginationDto;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        title: { $regex: search, $options: 'i' },
      };
    }

    const [data, total] = await Promise.all([
      this.promotionModel.find(query).skip(skip).limit(limit),
      this.promotionModel.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Promotion> {
    const promotion = await this.promotionModel.findById(id);
    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }
    return promotion;
  }

  async update(id: string, updatePromotionDto: Partial<CreatePromotionDto>): Promise<Promotion> {
    const promotion = await this.promotionModel.findById(id);
    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    // If there's a new banner image, delete the old one
    if (updatePromotionDto.bannerImg && promotion.bannerImg) {
      const oldImagePath = path.join('uploads/promotions', promotion.bannerImg);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    return this.promotionModel.findByIdAndUpdate(id, updatePromotionDto, { new: true });
  }

  async remove(id: string): Promise<void> {
    const promotion = await this.promotionModel.findById(id);
    if (!promotion) {
      throw new NotFoundException('Promotion not found');
    }

    // Delete the banner image file
    if (promotion.bannerImg) {
      const imagePath = path.join('uploads/promotions', promotion.bannerImg);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await this.promotionModel.findByIdAndDelete(id);
  }
} 