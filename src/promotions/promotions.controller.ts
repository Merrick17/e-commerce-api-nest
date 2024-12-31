import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/user-role.enum';
import { editFileName } from '../common/utils/file-upload.utils';

@ApiTags('promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('bannerImg', {
      storage: diskStorage({
        destination: './uploads/promotions',
        filename: editFileName,
      }),
      fileFilter: (req, file, callback) => {
        console.log('Incoming request body:', req.body);
        if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
          return callback(
            new BadRequestException({
              message: 'Invalid file format',
              errors: {
                bannerImg: ['Only JPG, JPEG, PNG, and WEBP files are allowed'],
              },
            }),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async create(
    @Body() createPromotionDto: CreatePromotionDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log('File received:', file);
    console.log('DTO received:', createPromotionDto);

    if (!file) {
      throw new BadRequestException('Banner image is required');
    }

    // Transform isActive to boolean if it exists
    if (createPromotionDto.isActive !== undefined) {
      createPromotionDto.isActive = String(createPromotionDto.isActive).toLowerCase() === 'true';
    }

    // Add the file path to the DTO
    createPromotionDto.bannerImg = `uploads/promotions/${file.filename}`;

    console.log('Final DTO:', createPromotionDto);

    return this.promotionsService.create(createPromotionDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.promotionsService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.promotionsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('bannerImg', {
      storage: diskStorage({
        destination: './uploads/promotions',
        filename: editFileName,
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
          return callback(
            new BadRequestException({
              message: 'Invalid file format',
              errors: {
                bannerImg: ['Only JPG, JPEG, PNG, and WEBP files are allowed'],
              },
            }),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() updatePromotionDto: Partial<CreatePromotionDto>,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    // Transform isActive to boolean if it exists
    if (typeof updatePromotionDto.isActive === 'string') {
      updatePromotionDto.isActive = String(updatePromotionDto.isActive).toLowerCase() === 'true';
    }

    if (file) {
      updatePromotionDto.bannerImg = `uploads/promotions/${file.filename}`;
    }

    return this.promotionsService.update(id, updatePromotionDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.promotionsService.remove(id);
  }
}