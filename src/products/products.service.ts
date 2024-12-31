import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CategoriesService } from '../categories/categories.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    private readonly categoriesService: CategoriesService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Verify category exists
    await this.categoriesService.findOne(createProductDto.category);

    // Validate flash price if product is on flash
    if (createProductDto.isOnFlash && !createProductDto.flashPrice) {
      throw new BadRequestException('Flash price is required when isOnFlash is true');
    }

    const createdProduct = new this.productModel(createProductDto);
    return createdProduct.save();
  }

  async findAll(paginationDto: PaginationDto): Promise<{
    data: Product[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page, limit, search } = paginationDto;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        name: { $regex: search, $options: 'i' },
      };
    }

    const [data, total] = await Promise.all([
      this.productModel
        .find(query)
        .populate('category', 'name')
        .skip(skip)
        .limit(limit),
      this.productModel.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productModel
      .findById(id)
      .populate('category', 'name');
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    // Verify category exists if it's being updated
    if (updateProductDto.category) {
      await this.categoriesService.findOne(updateProductDto.category);
    }

    // Validate flash price if product is being set to flash
    if (updateProductDto.isOnFlash) {
      const product = await this.findOne(id);
      if (!updateProductDto.flashPrice && !product.flashPrice) {
        throw new BadRequestException('Flash price is required when isOnFlash is true');
      }
    }

    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .populate('category', 'name');

    if (!updatedProduct) {
      throw new NotFoundException('Product not found');
    }
    return updatedProduct;
  }

  async remove(id: string): Promise<void> {
    const result = await this.productModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Product not found');
    }
  }

  async findByCategory(categoryId: string, paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.productModel
        .find({ category: categoryId })
        .populate('category', 'name')
        .skip(skip)
        .limit(limit),
      this.productModel.countDocuments({ category: categoryId }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOnFlash(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.productModel
        .find({ isOnFlash: true })
        .populate('category', 'name')
        .skip(skip)
        .limit(limit),
      this.productModel.countDocuments({ isOnFlash: true }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findFeatured(paginationDto: PaginationDto) {
    const { page, limit } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.productModel
        .find({ isFeatured: true })
        .populate('category', 'name')
        .skip(skip)
        .limit(limit),
      this.productModel.countDocuments({ isFeatured: true }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async searchProducts(paginationDto: PaginationDto): Promise<{
    data: Product[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page, limit, search } = paginationDto;
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const [data, total] = await Promise.all([
      this.productModel
        .find(query)
        .populate('category', 'name')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.productModel.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getLatestProducts(limit: number = 10): Promise<Product[]> {
    return this.productModel
      .find({ isOnStock: true })
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async getRecommendedProducts(
    userId?: string,
    limit: number = 10
  ): Promise<Product[]> {
    // If no userId, return featured products
    if (!userId) {
      return this.productModel
        .find({ isFeatured: true, isOnStock: true })
        .populate('category', 'name')
        .limit(limit);
    }

    // TODO: Implement more sophisticated recommendation logic based on:
    // - User's purchase history
    // - User's browsing history
    // - User's wishlist
    // - Similar products in the same categories
    // For now, return a mix of featured and latest products
    const [featuredProducts, latestProducts] = await Promise.all([
      this.productModel
        .find({ isFeatured: true, isOnStock: true })
        .populate('category', 'name')
        .limit(limit / 2),
      this.productModel
        .find({ isOnStock: true })
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .limit(limit / 2)
    ]);

    return [...featuredProducts, ...latestProducts];
  }
} 