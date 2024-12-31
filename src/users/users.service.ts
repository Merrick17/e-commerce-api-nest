import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { Product } from '../products/schemas/product.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginationResponse } from '../common/interfaces/pagination-response.interface';
import { AddToCartDto } from './dto/cart.dto';
import * as bcrypt from 'bcrypt';
import { PaginationUsersDto } from './dto/pagination-users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userModel.findOne({ email: createUserDto.email });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    return createdUser.save();
  }

  async findAll(paginationDto: PaginationUsersDto): Promise<{
    data: User[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page, limit, search, role, isActive } = paginationDto;
    const skip = (page - 1) * limit;

    // Build query object
    const query: any = {};

    // Add search condition if provided
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Add role filter if provided
    if (role) {
      query.role = role;
    }

    // Add isActive filter if provided
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.userModel
        .find(query)
        .select('-password') // Exclude password from results
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      this.userModel.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async update(id: string, updateUserDto: Partial<CreateUserDto>): Promise<User> {
    if (updateUserDto.email) {
      const existingUser = await this.userModel.findOne({
        email: updateUserDto.email,
        _id: { $ne: id },
      });
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return updatedUser;
  }

  async remove(id: string): Promise<User> {
    const deletedUser = await this.userModel.findByIdAndDelete(id);
    if (!deletedUser) {
      throw new NotFoundException('User not found');
    }
    return deletedUser;
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<User> {
    const product = await this.productModel.findById(addToCartDto.productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const cartItemIndex = user.cart.findIndex(
      (item) => item.product.toString() === addToCartDto.productId,
    );

    if (cartItemIndex > -1) {
      user.cart[cartItemIndex].quantity += addToCartDto.quantity;
    } else {
      user.cart.push({
        product: product._id,
        quantity: addToCartDto.quantity,
      });
    }

    await user.save();
    return this.getCart(userId);
  }

  async getCart(userId: string): Promise<User> {
    const user = await this.userModel
      .findById(userId)
      .populate({
        path: 'cart.product',
        model: 'Product',
        populate: {
          path: 'category',
          model: 'Category',
          select: 'name image description'
        }
      })
      .select('cart')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateCartQuantity(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const cartItemIndex = user.cart.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (cartItemIndex === -1) {
      throw new NotFoundException('Product not found in cart');
    }

    user.cart[cartItemIndex].quantity = quantity;
    await user.save();
    return this.getCart(userId);
  }

  async removeFromCart(userId: string, productId: string): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.cart = user.cart.filter(
      (item) => item.product.toString() !== productId,
    );
    await user.save();
    return this.getCart(userId);
  }

  async addToWishlist(userId: string, productId: string): Promise<User> {
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const wishlistIds = user.wishlist.map(id => id.toString());
    if (!wishlistIds.includes(productId)) {
      user.wishlist.push(product._id);
      await user.save();
    }

    return this.getWishlist(userId);
  }

  async getWishlist(userId: string): Promise<User> {
    const user = await this.userModel
      .findById(userId)
      .populate('wishlist')
      .select('wishlist')
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async removeFromWishlist(userId: string, productId: string): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.wishlist = user.wishlist.filter(
      (id) => id.toString() !== productId,
    );
    await user.save();
    return this.getWishlist(userId);
  }

  async clearCart(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    user.cart = [];
    await user.save();
  }
} 