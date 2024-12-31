import { IsString, IsOptional, IsBoolean, IsObject, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateStoreConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storeName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  bannerUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  seoKeywords?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isMaintenanceMode?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  appearance?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
  };
} 