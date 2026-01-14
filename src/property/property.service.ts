import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property, PropertyDocument } from './schemas/property.schema';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { SearchPropertyDto } from './dto/search-property.dto';
import { RoleEnum } from 'src/common/enums/role.enum';
import { UploadService } from 'src/uploads/upload.service';
import { CreateNotificationDto } from 'src/notification/dto/create-notification.dto';
import { NotificationService } from 'src/notification/notification.service';
import { NotificationPurposeEnum } from 'src/common/enums/notification.enum';
import { FilterPropertyDto } from './dto/filter.dto';
 
@Injectable()
export class PropertyService {
  constructor(
    @InjectModel(Property.name) private propertyModel: Model<PropertyDocument>,
    private uploadService: UploadService, // Inject UploadService
    private notificationService: NotificationService,
  ) { }

 async create(
  createPropertyDto: CreatePropertyDto,
  user: any,
  files?: Express.Multer.File[],
): Promise<PropertyDocument> {
  if (!user.roles.includes(RoleEnum.User) && !user.roles.includes(RoleEnum.Admin)) {
    throw new UnauthorizedException('Only users, or admins can create properties');
  }

  let imagePaths: string[] = [];
  if (files && files.length > 0) {
    imagePaths = await Promise.all(
      files.map(file => this.uploadService.uploadFile(file, 'property')),
    );
  }

  const newProperty = new this.propertyModel({
    ...createPropertyDto,
    ownerId: user.userId,
    agents: createPropertyDto.agents ?? [],
    images: imagePaths, // store uploaded images
    location: createPropertyDto.location
  ? {
      type: createPropertyDto.location.type,
      coordinates: createPropertyDto.location.coordinates,
    }
  : undefined,
  });
  console.log('New Property:', newProperty);
  const savedProperty = await newProperty.save();

  // Send notification logic remains the same
  const notificationDto: CreateNotificationDto = {
    userId: user.userId,
    message: `A new property "${createPropertyDto.title}" has been created by ${user.firstName} ${user.lastName || ''}.`,
    type: 'in-app',
    allowedRoles: [RoleEnum.Admin, RoleEnum.Seller],
    purpose: NotificationPurposeEnum.PROPERTY_CREATED, // ✅ make sure enum matches
    relatedId: savedProperty._id?.toString(),
    relatedModel: 'Property',
  };
  await this.notificationService.send(notificationDto);

  return savedProperty;
}

  async findAll(searchDto: SearchPropertyDto): Promise<{ properties: PropertyDocument[]; total: number }> {
    const { minPrice, maxPrice, minArea, maxArea, type, page = 1, limit = 10 } = searchDto;
    // const filter: any = { status: 'active' };
    const filter: any = {};
    if (minPrice) filter.price = { $gte: minPrice };
    if (maxPrice) filter.price = { ...filter.price, $lte: maxPrice };
    if (minArea) filter.area = { $gte: minArea };
    if (maxArea) filter.area = { ...filter.area, $lte: maxArea };
    if (type) filter.type = type;

    const properties = await this.propertyModel
      .find(filter)
      .sort({ createdAt: -1 }) 
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const total = await this.propertyModel.countDocuments(filter);

    return { properties, total };
  }

  async findOne(id: string): Promise<PropertyDocument> {
    const property = await this.propertyModel.findById(id).exec();
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto, user: any): Promise<PropertyDocument> {
    const property = await this.findOne(id);
    if (property.ownerId.toString() !== user.userId && !user.roles.includes(RoleEnum.Admin)) {
      throw new UnauthorizedException('You can only update your own properties');
    }
    const updated = await this.propertyModel.findByIdAndUpdate(id, updatePropertyDto, { new: true }).exec();
    if (!updated) throw new NotFoundException('Update failed');
    return updated;
  }

  async remove(id: string, user: any): Promise<void> {
    const property = await this.findOne(id);
    if (property.ownerId.toString() !== user.userId && !user.roles.includes(RoleEnum.Admin)) {
      throw new UnauthorizedException('You can only delete your own properties');
    }
    await this.propertyModel.deleteOne({ _id: id });
  }

  async addImages(id: string, files: Express.Multer.File[], user: any): Promise<string[]> {
    const property = await this.findOne(id);
    if (property.ownerId.toString() !== user.userId && !user.roles.includes(RoleEnum.Admin)) {
      throw new UnauthorizedException('You can only upload images for your own properties');
    }
    if (property.images && property.images.length >= 12) {
      throw new BadRequestException('Maximum 12 images allowed per property');
    }
    if (!property.images) property.images = [];
    const newPaths = await Promise.all(files.map(file => this.uploadService.uploadFile(file, 'property')));
    const totalNewImages = property.images.length + newPaths.length;
    if (totalNewImages > 12) {
      throw new BadRequestException(`Adding ${newPaths.length} images would exceed the 12-image limit. Current: ${property.images.length}, Max: 12`);
    }
    property.images.push(...newPaths);
    await property.save();
    return newPaths; // Return array of new paths
  }

  async requestInquiry(id: string, inquiryData: { name: string; email: string; message: string }, user: any): Promise<void> {
    const property = await this.findOne(id);
    // Future: Create transaction lead, send notification
    // Example: await this.notificationService.send(property.ownerId.toString(), `Inquiry from ${inquiryData.email}: ${inquiryData.message}`);
  }

  async sendDealRequest(propertyId: string, dealData: { commissionRate: number; terms: string }, agentUser: any): Promise<void> {
    const property = await this.findOne(propertyId);
    if (!agentUser.roles.includes(RoleEnum.Agent)) throw new UnauthorizedException('Only agents can send deal requests');
    const limit = property.type === 'rent' ? 2 : 4;
    if (property.agents.length >= limit) throw new BadRequestException('Agent limit reached');
   property.agents.push(agentUser.userId.toString());
    await property.save();
    // Send notification to owner
    // Example: await this.notificationService.send(property.ownerId.toString(), `New deal request from agent ${agentUser.userId}`);
  }

  async acceptDeal(
  propertyId: string, 
  agentId: string, 
  ownerUser: any
): Promise<void> {
  const property = await this.findOne(propertyId);

  if (property.ownerId.toString() !== ownerUser.userId) {
    throw new UnauthorizedException('Only owners can accept deals');
  }

  // Check if agent is in the list
  const agentIndex = property.agents.findIndex(a => a.toString() === agentId);
  if (agentIndex === -1) {
    throw new NotFoundException('Agent not found in requests');
  }

  // ✅ With string[] agents, you can’t set status here
  // Instead, you might move the accepted agent to another field
  // Example: property.acceptedAgents.push(agentId);

  await property.save();

  // Send notification
  // Example:
  // await this.notificationService.send(agentId, 'Your deal request was accepted');
}


//add filter 
async filterProperties(query: FilterPropertyDto) {
  const filters: any = {};

  // Location-based
  if (query.city) filters.city = query.city;
  if (query.address) filters.address = query.address;

  // Property type filter
  if (query.propertyType) filters.propertyType = query.propertyType;

  // Sale/rent type filter (optional)
  if (query.type) filters.type = query.type;

  // Bedrooms (exact)
  if (query.bedrooms !== undefined && query.bedrooms !== null) {
    const bedrooms = Number(query.bedrooms);
    if (!isNaN(bedrooms)) {
      filters.bedrooms = bedrooms;
    }
  }

  // Price range as single input like "50000-100000"
  if (typeof query.price === 'string' && query.price.includes('-')) {
    const [minStr, maxStr] = query.price.split('-');
    const min = Number(minStr);
    const max = Number(maxStr);

    filters.price = {};
    if (!isNaN(min)) filters.price.$gte = min;
    if (!isNaN(max)) filters.price.$lte = max;

    // If filters.price is still empty, remove it
    if (Object.keys(filters.price).length === 0) delete filters.price;
  }

  // Area range like "100-500"
  if (typeof query.area === 'string' && query.area.includes('-')) {
    const [minStr, maxStr] = query.area.split('-');
    const min = Number(minStr);
    const max = Number(maxStr);

    filters.area = {};
    if (!isNaN(min)) filters.area.$gte = min;
    if (!isNaN(max)) filters.area.$lte = max;

    if (Object.keys(filters.area).length === 0) delete filters.area;
  }

  return this.propertyModel.find(filters).exec();
}



  

}