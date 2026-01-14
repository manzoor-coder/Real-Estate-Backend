import { Test, TestingModule } from '@nestjs/testing';
import { PropertyviewsController } from './propertyviews.controller';
import { PropertyviewsService } from './propertyviews.service';

describe('PropertyviewsController', () => {
  let controller: PropertyviewsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropertyviewsController],
      providers: [PropertyviewsService],
    }).compile();

    controller = module.get<PropertyviewsController>(PropertyviewsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
