import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StoreConfigService } from './store-config.service';
import { UpdateStoreConfigDto } from './dto/update-store-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/user-role.enum';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('store-config')
@Controller('store-config')
export class StoreConfigController {
  constructor(private readonly storeConfigService: StoreConfigService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get store configuration' })
  getConfig() {
    return this.storeConfigService.getConfig();
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update store configuration' })
  updateConfig(@Body() updateStoreConfigDto: UpdateStoreConfigDto) {
    return this.storeConfigService.updateConfig(updateStoreConfigDto);
  }
} 