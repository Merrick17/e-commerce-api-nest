import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderStatus } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ProductsService } from '../products/products.service';
import { PromoCodesService } from '../promo-codes/promo-codes.service';
import { UsersService } from '../users/users.service';
import { PaginationResponse } from '../common/interfaces/pagination-response.interface';
import { OrderProduct } from './interfaces/order-product.interface';
import { PaymentMethod } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  private readonly VAT_PERCENTAGE = 0.15; // 15% VAT

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    private readonly productsService: ProductsService,
    private readonly promoCodesService: PromoCodesService,
    private readonly usersService: UsersService,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto): Promise<Order> {
    const orderProducts = await Promise.all(
      createOrderDto.products.map(async (item) => {
        const product = await this.productsService.findOne(item.product);
        if (!product.isOnStock) {
          throw new BadRequestException(`Product ${product.name} is out of stock`);
        }
        const price = product.isOnFlash ? product.flashPrice : product.sellPrice;
        return {
          product: item.product,
          quantity: item.quantity,
          price,
        };
      }),
    );

    const subtotal = orderProducts.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    let promoDiscount = 0;
    if (createOrderDto.promoCode) {
      const promoCode = await this.promoCodesService.findByCode(
        createOrderDto.promoCode,
      );
      promoDiscount = (subtotal * promoCode.percentage) / 100;
    }

    // Validate card payment details if payment method is card
    if (createOrderDto.paymentDetails.paymentMethod === PaymentMethod.CARD) {
      if (!createOrderDto.paymentDetails.cardNumber || 
          !createOrderDto.paymentDetails.expiryDate || 
          !createOrderDto.paymentDetails.cvv) {
        throw new BadRequestException('Card details are required for card payment');
      }
      // Here you would typically integrate with a payment processor
      // For now, we'll just mask the card number
      createOrderDto.paymentDetails.cardNumber = 
        `****${createOrderDto.paymentDetails.cardNumber.slice(-4)}`;
    }

    const VAT = (subtotal - promoDiscount) * this.VAT_PERCENTAGE;
    const total = subtotal - promoDiscount + VAT;

    const order = new this.orderModel({
      products: orderProducts,
      orderCreator: userId,
      shippingDetails: createOrderDto.shippingDetails,
      paymentDetails: createOrderDto.paymentDetails,
      subtotal,
      promoDiscount,
      VAT,
      total,
    });

    // Save the order first
    const savedOrder = await order.save();

    // Clear the user's cart after successful order creation
    await this.usersService.clearCart(userId);

    return savedOrder;
  }

  async findAll(paginationDto: PaginationDto): Promise<PaginationResponse<Order>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.orderModel
        .find()
        .populate('orderCreator', 'name email')
        .populate('products.product', 'name mainImage images sellPrice flashPrice isOnFlash')
        .skip(skip)
        .limit(limit),
      this.orderModel.countDocuments(),
    ]);

    return {
      items: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderModel
      .findById(id)
      .populate('orderCreator', 'name email')
      .populate('products.product', 'name mainImage images sellPrice flashPrice isOnFlash');
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async findUserOrders(
    userId: string,
    paginationDto: PaginationDto,
  ): Promise<PaginationResponse<Order>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.orderModel
        .find({ orderCreator: userId })
        .populate('products.product', 'name mainImage images sellPrice flashPrice isOnFlash')
        .skip(skip)
        .limit(limit),
      this.orderModel.countDocuments({ orderCreator: userId }),
    ]);

    return {
      items: orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.orderModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .populate('orderCreator', 'name email')
      .populate('products.product', 'name mainImage images sellPrice flashPrice isOnFlash');

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
} 