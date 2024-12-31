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
  Put,
} from '@nestjs/common';
import { 
  ApiBearerAuth, 
  ApiTags, 
  ApiOperation, 
  ApiResponse,
  ApiParam,
  ApiQuery 
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AddToCartDto, UpdateCartQuantityDto } from './dto/cart.dto';
import { ProfileResponseDto } from './dto/profile.dto';
import { PaginationUsersDto } from './dto/pagination-users.dto';
import { Public } from '../auth/decorators/public.decorator';



@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('cart')
  @ApiOperation({ summary: 'Get user cart' })
  @ApiBearerAuth()
  async getCart(@CurrentUser() user: any) {
    return this.usersService.getCart(user.userId);
  }

  @Post('cart')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiBearerAuth()
  async addToCart(
    @CurrentUser() user: any,
    @Body() addToCartDto: AddToCartDto,
  ) {
    return this.usersService.addToCart(user.userId, addToCartDto);
  }

  @Patch('cart/:productId')
  @UseGuards(JwtAuthGuard)
  updateCartQuantity(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.usersService.updateCartQuantity(user.userId, productId, quantity);
  }

  @Delete('cart/:productId')
  @UseGuards(JwtAuthGuard)
  removeFromCart(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
  ) {
    return this.usersService.removeFromCart(user.userId, productId);
  }

  @Delete('cart')
  @ApiOperation({ summary: 'Clear entire cart' })
  @ApiBearerAuth()
  async clearCart(@CurrentUser() user: any) {
    await this.usersService.clearCart(user.userId);
    return { message: 'Cart cleared successfully' };
  }

  @Get('wishlist')
  @ApiOperation({ summary: 'Get user wishlist' })
  getWishlist(@CurrentUser() user: any) {
    return this.usersService.getWishlist(user.userId);
  }

  @Post('wishlist/:productId')
  @ApiOperation({ summary: 'Add product to wishlist' })
  addToWishlist(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
  ) {
    return this.usersService.addToWishlist(user.userId, productId);
  }

  @Delete('wishlist/:productId')
  @ApiOperation({ summary: 'Remove product from wishlist' })
  removeFromWishlist(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
  ) {
    return this.usersService.removeFromWishlist(user.userId, productId);
  }

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new user account' })
  @ApiResponse({ 
    status: 201, 
    description: 'User account has been successfully created.',
    type: CreateUserDto 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation error or email already exists.' 
  })
  async register(@Body() createUserDto: CreateUserDto) {
    createUserDto.role = UserRole.USER;
    createUserDto.isActive = true;

    const user = await this.usersService.create(createUserDto);
    
    const { password, ...result } = user.toObject();
    
    return {
      message: 'Registration successful',
      data: result,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Return the user.',
  })
  @ApiResponse({ status: 404, description: 'User not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all users with filters' })
  @ApiResponse({ 
    status: 200, 
    description: 'Return paginated users list.',
  })
  findAll(@Query() paginationDto: PaginationUsersDto) {
    return this.usersService.findAll(paginationDto);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ 
    status: 201, 
    description: 'The user has been successfully created.',
    type: CreateUserDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updateUserDto: Partial<CreateUserDto>) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the current user profile',
    type: ProfileResponseDto 
  })
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.findOne(user.userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the updated user profile',
    type: ProfileResponseDto 
  })
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateUserDto: Partial<CreateUserDto>
  ) {
    return this.usersService.update(user.userId, updateUserDto);
  }
} 