//@ts-nocheck
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  InternalServerErrorException,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UserRole } from '../common/interfaces/user-role.enum';
import { editFileName } from '../common/utils/file-upload.utils';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductsService } from './products.service';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';


@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'mainImage', maxCount: 1 },
      { name: 'images', maxCount: 10 }
    ], {
      storage: diskStorage({
        destination: './uploads/products',
        filename: editFileName,
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
          return callback(
            new BadRequestException({
              message: 'Invalid file format',
              errors: {
                [file.fieldname]: ['Only JPG, JPEG, PNG, and WEBP files are allowed'],
              },
            }),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024,
        files: 11,
      },
    }),
  )
  async create(
    @Body() body: any,
    @UploadedFiles()
    files: {
      mainImage?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ) {
    try {
      if (!files?.mainImage?.[0]) {
        throw new BadRequestException({
          message: 'Missing required file',
          errors: {
            mainImage: ['Main product image is required'],
          },
        });
      }

      // Transform form data values to proper types
      const createProductDto: CreateProductDto = {
        name: body.name,
        description: body.description,
        category: body.category,
        isOnStock: body.isOnStock === 'true',
        buyPrice: Number(body.buyPrice),
        sellPrice: Number(body.sellPrice),
        isOnFlash: body.isOnFlash === 'true',
        flashPrice: body.flashPrice ? Number(body.flashPrice) : undefined,
        isFeatured: body.isFeatured === 'true',
        mainImage: `uploads/products/${files.mainImage[0].filename}`,
        images: files.images?.map(file => `uploads/products/${file.filename}`) || [],
      };

      // Validate the transformed data
      if (isNaN(createProductDto.buyPrice)) {
        throw new BadRequestException({
          message: 'Invalid buy price',
          errors: {
            buyPrice: ['Buy price must be a valid number'],
          },
        });
      }

      if (isNaN(createProductDto.sellPrice)) {
        throw new BadRequestException({
          message: 'Invalid sell price',
          errors: {
            sellPrice: ['Sell price must be a valid number'],
          },
        });
      }

      if (createProductDto.flashPrice !== undefined && isNaN(createProductDto.flashPrice)) {
        throw new BadRequestException({
          message: 'Invalid flash price',
          errors: {
            flashPrice: ['Flash price must be a valid number'],
          },
        });
      }

      const product = await this.productsService.create(createProductDto);

      return {
        message: 'Product created successfully',
        data: product,
      };
    } catch (error) {
      // ... existing error handling ...
      throw error;
    }
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.productsService.findAll(paginationDto);
  }

  @Get('featured')
  @ApiOperation({ summary: 'Get featured products' })
  findFeatured(@Query() paginationDto: PaginationDto) {
    return this.productsService.findFeatured(paginationDto);
  }

  @Get('flash')
  findOnFlash(@Query() paginationDto: PaginationDto) {
    return this.productsService.findOnFlash(paginationDto);
  }

  @Get('category/:categoryId')
  findByCategory(
    @Param('categoryId') categoryId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.productsService.findByCategory(categoryId, paginationDto);
  }

  @Get('latest')
  getLatestProducts(@Query('limit') limit: number) {
    return this.productsService.getLatestProducts(limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'mainImage', maxCount: 1 },
      { name: 'images', maxCount: 10 }
    ], {
      storage: diskStorage({
        destination: './uploads/products',
        filename: editFileName,
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
          return callback(
            new BadRequestException({
              message: 'Invalid file format',
              errors: {
                [file.fieldname]: ['Only JPG, JPEG, PNG, and WEBP files are allowed'],
              },
            }),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024,
        files: 11,
      },
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFiles()
    files: {
      mainImage?: Express.Multer.File[];
      images?: Express.Multer.File[];
    },
  ) {
    try {
      // Get existing product to preserve unchanged values
      const existingProduct = await this.productsService.findOne(id);

      // Transform form data values to proper types
      const updateProductDto: UpdateProductDto = {
        ...(body.name && { name: body.name }),
        ...(body.description && { description: body.description }),
        ...(body.category && { category: body.category }),
        ...(body.isOnStock !== undefined && { isOnStock: body.isOnStock === 'true' }),
        ...(body.buyPrice && { buyPrice: Number(body.buyPrice) }),
        ...(body.sellPrice && { sellPrice: Number(body.sellPrice) }),
        ...(body.isOnFlash !== undefined && { isOnFlash: body.isOnFlash === 'true' }),
        ...(body.flashPrice && { flashPrice: Number(body.flashPrice) }),
        ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured === 'true' }),
      };

      // Handle file updates
      if (files?.mainImage?.[0]) {
        updateProductDto.mainImage = `uploads/products/${files.mainImage[0].filename}`;
      }

      if (files?.images?.length) {
        updateProductDto.images = files.images.map(file => `uploads/products/${file.filename}`);
      }

      // Validate numeric values if present
      if (updateProductDto.buyPrice !== undefined && isNaN(updateProductDto.buyPrice)) {
        throw new BadRequestException({
          message: 'Invalid buy price',
          errors: {
            buyPrice: ['Buy price must be a valid number'],
          },
        });
      }

      if (updateProductDto.sellPrice !== undefined && isNaN(updateProductDto.sellPrice)) {
        throw new BadRequestException({
          message: 'Invalid sell price',
          errors: {
            sellPrice: ['Sell price must be a valid number'],
          },
        });
      }

      if (updateProductDto.flashPrice !== undefined && isNaN(updateProductDto.flashPrice)) {
        throw new BadRequestException({
          message: 'Invalid flash price',
          errors: {
            flashPrice: ['Flash price must be a valid number'],
          },
        });
      }

      // Validate price relationships
      if (updateProductDto.buyPrice && updateProductDto.sellPrice) {
        if (updateProductDto.sellPrice <= updateProductDto.buyPrice) {
          throw new BadRequestException({
            message: 'Invalid pricing',
            errors: {
              sellPrice: ['Selling price must be greater than buying price'],
            },
          });
        }
      } else if (updateProductDto.buyPrice && updateProductDto.buyPrice >= existingProduct.sellPrice) {
        throw new BadRequestException({
          message: 'Invalid pricing',
          errors: {
            buyPrice: ['Buying price must be less than current selling price'],
          },
        });
      } else if (updateProductDto.sellPrice && updateProductDto.sellPrice <= existingProduct.buyPrice) {
        throw new BadRequestException({
          message: 'Invalid pricing',
          errors: {
            sellPrice: ['Selling price must be greater than current buying price'],
          },
        });
      }

      // Validate flash sale configuration
      if (updateProductDto.isOnFlash && !existingProduct.flashPrice && !updateProductDto.flashPrice) {
        throw new BadRequestException({
          message: 'Invalid flash sale configuration',
          errors: {
            flashPrice: ['Flash price is required when enabling flash sale'],
          },
        });
      }

      const updatedProduct = await this.productsService.update(id, updateProductDto);

      return {
        message: 'Product updated successfully',
        data: updatedProduct,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error.name === 'ValidationError') {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: Object.keys(error.errors).reduce((acc, key) => {
            acc[key] = [error.errors[key].message];
            return acc;
          }, {}),
        });
      }

      if (error.name === 'CastError') {
        throw new BadRequestException({
          message: 'Invalid data format',
          errors: {
            [error.path]: [`Invalid ${error.path} format`],
          },
        });
      }

      throw new InternalServerErrorException({
        message: 'Failed to update product',
        errors: {
          general: ['An unexpected error occurred while updating the product'],
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
      });
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Get('search')
  @Public()
  @ApiOperation({ summary: 'Search products' })
  searchProducts(@Query() paginationDto: PaginationDto) {
    return this.productsService.searchProducts(paginationDto);
  }

  @Get('latest')
  @Public()
  @ApiOperation({ summary: 'Get latest products' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of products to return (default: 10)',
  })
  getLatestProducts(@Query('limit') limit?: number) {
    return this.productsService.getLatestProducts(limit);
  }

  @Get('recommended')
  @ApiOperation({ summary: 'Get recommended products' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of products to return (default: 10)',
  })
  getRecommendedProducts(
    @CurrentUser() user: any,
    @Query('limit') limit?: number
  ) {
    return this.productsService.getRecommendedProducts(user?.userId, limit);
  }
} 