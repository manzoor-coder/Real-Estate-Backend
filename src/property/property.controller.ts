import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, UseGuards, Request, Query, UploadedFiles, BadRequestException, Req } from '@nestjs/common';
import { PropertyService } from './property.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { SearchPropertyDto } from './dto/search-property.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RoleEnum } from 'src/common/enums/role.enum';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiParam, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { FilterPropertyDto } from './dto/filter.dto';

@ApiTags('Property')
@Controller('property')
export class PropertyController {
  constructor(private readonly propertyService: PropertyService) { }

  // POST /property - Create a new property (sellers, admins)

  @Post()
  @ApiOperation({ summary: 'Create a new property', description: 'Allows sellers, or admins to create properties.' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Luxury Apartment' },
        description: { type: 'string', example: 'Spacious 3BHK with sea view' },
        price: { type: 'number', example: 150000 },
        area: { type: 'number', example: 1200 },
        type: { type: 'string', example: 'apartment' },
        data: { type: 'object',  },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
      required: ['title', 'price', 'type'],
    },
  })
  @ApiCreatedResponse({ description: 'Property created successfully', type: CreatePropertyDto })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.User, RoleEnum.Admin)
  @UseInterceptors(
    FilesInterceptor('files', 100, {
      storage: diskStorage({
        destination: './uploads/property',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const fileName = `${file.fieldname}-${uniqueSuffix}${ext}`;
          callback(null, fileName);
        },
      }),
    }),
  )
  async create(
    @Body() createPropertyDto: CreatePropertyDto,
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
  ) {
   let parsedData: any = {};

  if (req.body.data) {
    try {
      parsedData = JSON.parse(req.body.data);
    } catch (err) {
      throw new BadRequestException('Invalid JSON in "data" field');
    }
  }

  // Merge with top-level fields
  const createPropertyDtos: CreatePropertyDto = {
    ...req.body,
    ...parsedData,
  };

  console.log('Parsed DTO.location:', createPropertyDtos.location);

    return this.propertyService.create(createPropertyDtos, req.user, files);
  }


  // PATCH /property/:id - Update property
  @Patch(':id')
  @ApiOperation({ summary: 'Update property', description: 'Allows owners or admins to update properties.' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Property ID', type: String })
  @ApiOkResponse({ description: 'Property updated', type: UpdatePropertyDto })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Seller, RoleEnum.Admin)
  update(@Param('id') id: string, @Body() updatePropertyDto: UpdatePropertyDto, @Request() req) {
    return this.propertyService.update(id, updatePropertyDto, req.user);
  }

  // DELETE /property/:id - Delete property
  @Delete(':id')
  @ApiOperation({ summary: 'Delete property', description: 'Allows owners or admins to delete properties.' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Property ID', type: String })
  @ApiOkResponse({ description: 'Property deleted' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Admin, RoleEnum.Seller)
  remove(@Param('id') id: string, @Request() req) {
    return this.propertyService.remove(id, req.user);
  }

  // GET /property - Search properties with filters
  @Get()
  @ApiOperation({ summary: 'Search properties', description: 'Retrieves paginated properties with filters.' })
  @ApiOkResponse({ description: 'Properties retrieved', schema: { properties: { properties: { type: 'array' }, total: { type: 'number' } } } })
  findAll(@Query() searchDto: SearchPropertyDto) {
    return this.propertyService.findAll(searchDto);
  }

  ///adding filter endpoint
   @Get('filter')
  async filterProperties(@Query() query: FilterPropertyDto) {
    return this.propertyService.filterProperties(query);
  }

  // GET /property/:id - Get property details
  @Get(':id')
  @ApiOperation({ summary: 'Get property by ID', description: 'Retrieves a single property.' })
  @ApiParam({ name: 'id', description: 'Property ID', type: String })
  @ApiOkResponse({ description: 'Property found' })
  findOne(@Param('id') id: string) {
    return this.propertyService.findOne(id);
  }

  // POST /property/upload-property-images/:id - Upload property images
  @Post('upload-property-images/:id')
  @ApiOperation({ summary: 'Upload property image', description: 'Adds an image to the property.' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Property ID', type: String })
  @ApiOkResponse({
    description: 'Array of image paths uploaded',
    schema: { type: 'array', items: { type: 'string' } }, // e.g., ["/property/a1b2c3d4.jpg", "/property/e5f6g7h8.png"]
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Seller, RoleEnum.Admin) // Restrict to owners
  @UseInterceptors(FilesInterceptor('files', 12, { dest: './uploads/property' })) // Limit to 12 files
  async uploadImage(@Param('id') id: string, @UploadedFiles() files: Express.Multer.File[], @Request() req) {
    if (!files || files.length === 0) throw new BadRequestException('No files uploaded');
    const paths = await this.propertyService.addImages(id, files, req.user);
    return { image: paths };
  }

  // POST /property/:id/request - Submit inquiry
  @Post(':id/request')
  @ApiOperation({ summary: 'Submit property inquiry', description: 'Users submit interest in a property.' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Property ID', type: String })
  @ApiBody({ type: Object, schema: { properties: { name: { type: 'string' }, email: { type: 'string' }, message: { type: 'string' } } } })
  @ApiOkResponse({ description: 'Inquiry sent' })
  @UseGuards(JwtAuthGuard)
  requestInquiry(@Param('id') id: string, @Body() inquiryData: { name: string; email: string; message: string }, @Request() req) {
    return this.propertyService.requestInquiry(id, inquiryData, req.user);
  }

  // POST /property/:id/deal-request - Agent sends deal request
  @Post(':id/deal-request')
  @ApiOperation({ summary: 'Send deal request to property', description: 'Agents propose terms to owners.' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Property ID', type: String })
  @ApiBody({ type: Object, schema: { properties: { commissionRate: { type: 'number' }, terms: { type: 'string' } } } })
  @ApiOkResponse({ description: 'Deal request sent' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Agent)
  sendDealRequest(@Param('id') id: string, @Body() dealData: { commissionRate: number; terms: string }, @Request() req) {
    return this.propertyService.sendDealRequest(id, dealData, req.user);
  }

  // POST /property/:id/accept-deal - Owner accepts deal
  @Post(':id/accept-deal')
  @ApiOperation({ summary: 'Accept agent deal', description: 'Owners accept agent proposals.' })
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', description: 'Property ID', type: String })
  @ApiBody({ type: Object, schema: { properties: { agentId: { type: 'string' } } } })
  @ApiOkResponse({ description: 'Deal accepted' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.Seller)
  acceptDeal(@Param('id') id: string, @Body() body: { agentId: string }, @Request() req) {
    return this.propertyService.acceptDeal(id, body.agentId, req.user);
  }




 
}