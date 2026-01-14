import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class UploadService {
  async uploadFile(file: Express.Multer.File, type: string): Promise<string> {
    if (!file) throw new BadRequestException('No file uploaded');

    // File is already saved by diskStorage
    return `/${type}/${file.filename}`;
  }
}
