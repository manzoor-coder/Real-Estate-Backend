import { PartialType } from '@nestjs/swagger';
import { CreatePropertyviewDto } from './create-propertyview.dto';

export class UpdatePropertyviewDto extends PartialType(CreatePropertyviewDto) {}
