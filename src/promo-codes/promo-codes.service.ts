import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PromoCode } from './schemas/promo-code.schema';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class PromoCodesService {
  constructor(
    @InjectModel(PromoCode.name) private readonly promoCodeModel: Model<PromoCode>,
  ) {}

  async create(createPromoCodeDto: CreatePromoCodeDto): Promise<PromoCode> {
    const existingCode = await this.promoCodeModel.findOne({
      code: createPromoCodeDto.code,
    });
    if (existingCode) {
      throw new BadRequestException('Promo code already exists');
    }

    const createdPromoCode = new this.promoCodeModel(createPromoCodeDto);
    return createdPromoCode.save();
  }

  async findAll(paginationDto: PaginationDto): Promise<{
    data: PromoCode[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page, limit, search } = paginationDto;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        code: { $regex: search, $options: 'i' },
      };
    }

    const [data, total] = await Promise.all([
      this.promoCodeModel.find(query).skip(skip).limit(limit),
      this.promoCodeModel.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<PromoCode> {
    const promoCode = await this.promoCodeModel.findById(id);
    if (!promoCode) {
      throw new NotFoundException('Promo code not found');
    }
    return promoCode;
  }

  async findByCode(code: string): Promise<PromoCode> {
    const promoCode = await this.promoCodeModel.findOne({
      code,
      isActive: true,
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: { $gt: new Date() } },
      ],
    });
    if (!promoCode) {
      throw new NotFoundException('Invalid or expired promo code');
    }
    return promoCode;
  }

  async update(id: string, updatePromoCodeDto: Partial<CreatePromoCodeDto>): Promise<PromoCode> {
    if (updatePromoCodeDto.code) {
      const existingCode = await this.promoCodeModel.findOne({
        code: updatePromoCodeDto.code,
        _id: { $ne: id },
      });
      if (existingCode) {
        throw new BadRequestException('Promo code already exists');
      }
    }

    const updatedPromoCode = await this.promoCodeModel.findByIdAndUpdate(
      id,
      updatePromoCodeDto,
      { new: true },
    );
    if (!updatedPromoCode) {
      throw new NotFoundException('Promo code not found');
    }
    return updatedPromoCode;
  }

  async remove(id: string): Promise<void> {
    const result = await this.promoCodeModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Promo code not found');
    }
  }
} 