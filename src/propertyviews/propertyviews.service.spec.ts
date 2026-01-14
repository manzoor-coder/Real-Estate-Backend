import { Test, TestingModule } from '@nestjs/testing';
import { PropertyviewsService } from './propertyviews.service';

describe('PropertyviewsService', () => {
  let service: PropertyviewsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PropertyviewsService],
    }).compile();

    service = module.get<PropertyviewsService>(PropertyviewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
