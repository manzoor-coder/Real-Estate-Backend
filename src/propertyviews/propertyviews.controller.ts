import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Query } from '@nestjs/common';
import { PropertyviewsService } from './propertyviews.service';
import { CreatePropertyviewDto } from './dto/create-propertyview.dto';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';


@Controller('propertyviews')
export class PropertyviewsController {
  constructor(private readonly propertyviewsService: PropertyviewsService) {}
   @Post("/public-view")
  async createviews(@Body() dto: CreatePropertyviewDto, @Req() req: any) {
    const ipAddress =
      req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    return this.propertyviewsService.createView({
      ...dto,
      ipAddress,
      userAgent,
    });
  }

 @Get('/public-view')
  @ApiOperation({ summary: 'Get property views' })
  @ApiQuery({
    name: 'propertyId',
    required: false,
    description: 'Filter views by property ID',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'List of property views',
    type: [CreatePropertyviewDto], // 👈 use DTO or Schema class
  })
  async getViews(@Query('propertyId') propertyId?: string) {
    if (propertyId) {
      return this.propertyviewsService.getViewsByProperty(propertyId);
    }
    return this.propertyviewsService.getAllViews();
  }

}
