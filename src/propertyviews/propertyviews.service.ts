// src/propertyviews/propertyviews.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePropertyviewDto } from './dto/create-propertyview.dto';
import { UpdatePropertyviewDto } from './dto/update-propertyview.dto';
import { Propertyview, PropertyviewDocument } from './schemas/publicview.schema';

@Injectable()
export class PropertyviewsService {
  constructor(
    @InjectModel(Propertyview.name)
    private readonly propertyViewModel: Model<PropertyviewDocument>, // yahan sahi model inject hoga
  ) {}

  // ✅ Create a new view
  async createView(dto: CreatePropertyviewDto): Promise<Propertyview> {
    const view = new this.propertyViewModel({
      ...dto,
      viewedAt: new Date(),
    });
    return view.save();
  }

  // ✅ Find all views for a property
  async findByProperty(propertyId: string): Promise<Propertyview[]> {
    return this.propertyViewModel
      .find({ propertyId })
      .populate('userId', 'fullName email')
      .sort({ viewedAt: -1 })
      .exec();
  }

  // ✅ Example: update (optional)

async getAllViews() {
    return this.propertyViewModel.find().exec();
  }

  async getViewsByProperty(propertyId: string) {
    return this.propertyViewModel.find({ propertyId }).exec();
  }
  
  
}
