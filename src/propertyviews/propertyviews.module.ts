import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PropertyviewsService } from './propertyviews.service';
import { PropertyviewsController } from './propertyviews.controller';
import { Propertyview, PropertyviewSchema } from './schemas/publicview.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Propertyview.name, schema: PropertyviewSchema },
    ]),
  ],
  controllers: [PropertyviewsController],
  providers: [PropertyviewsService],
  exports: [PropertyviewsService],
})
export class PropertyviewsModule {}