// src/propertyviews/schemas/propertyview.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PropertyviewDocument = Propertyview & Document;

@Schema({ timestamps: true })
export class Propertyview {
  @Prop({ type: Types.ObjectId, ref: 'Property', required: true })
  propertyId: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: string;

  @Prop()
  ipAddress?: string;

  @Prop()
  userAgent?: string;

  @Prop({ default: Date.now })
  viewedAt: Date;
}

export const PropertyviewSchema = SchemaFactory.createForClass(Propertyview);
