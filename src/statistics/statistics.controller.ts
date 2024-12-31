import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { StatisticsService, DashboardResponse } from './statistics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/user-role.enum';

@ApiTags('statistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  getDashboardStats() {
    return this.statisticsService.getDashboardStats();
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue statistics' })
  @ApiQuery({
    name: 'period',
    enum: ['daily', 'monthly', 'yearly'],
    required: false,
  })
  getRevenueStats(@Query('period') period?: 'daily' | 'monthly' | 'yearly') {
    return this.statisticsService.getRevenueStats(period);
  }

  @Get('extended-dashboard')
  @ApiOperation({ summary: 'Get extended dashboard statistics' })
  getExtendedDashboardStats(): Promise<DashboardResponse> {
    return this.statisticsService.getExtendedDashboardStats();
  }
} 