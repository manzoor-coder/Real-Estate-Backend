import { IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterPropertyDto {
  @ApiPropertyOptional({ description: 'City name to filter by', example: 'Rahim Yar Khan' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Address to filter by', example: 'Street 1' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Type of property', example: 'office' })
  @IsOptional()
  @IsString()
  propertyType?: string;


  
  @ApiPropertyOptional({ description: 'Sale/Rent type', example: 'sale' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Number of bedrooms', example: 3 })
  @IsOptional()
  @IsNumber()
  bedrooms?: number;

  @ApiPropertyOptional({ description: 'Price range in format "min-max"', example: '50000-100000' })
  @IsOptional()
  @IsString()
  price?: string;

  @ApiPropertyOptional({ description: 'Area range in format "min-max"', example: '100-200' })
  @IsOptional()
  @IsString()
  area?: string; // <-- single column input like price
}
