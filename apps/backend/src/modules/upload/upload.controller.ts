import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { CloudinaryService } from '@/common/services/cloudinary.service';
import { UploadImageDecorator, DeleteImagesDecorator } from './decorators/upload.decorator';
import { FlexibleJwtGuard } from '@/common/guards/flexible-jwt.guard';
import { successResponse } from '@/utils/response.handler';
import {
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  InternalServerErrorException,
  Controller,
  Delete,
  Body,
  UseGuards,
  Logger,
  Query,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

// Minimal uploaded file shape used by Cloudinary upload
type UploadedFile = {
  fieldname?: string;
  originalname: string;
  encoding?: string;
  mimetype?: string;
  buffer: Buffer;
  size?: number;
};

export interface DeleteImageDto {
  urls: string[];
}

@ApiTags('upload')
@Controller('uploads')
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('image')
  @UseGuards(FlexibleJwtGuard)
  @ApiQuery({
    name: 'folder',
    required: false,
    description: 'Target folder in Cloudinary',
  })
  @UploadImageDecorator('Upload image to Cloudinary')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @Query('folder') folder: string = 'Zonite/general',
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB limit
          new FileTypeValidator({ fileType: '.(jpeg|png|gif|webp)' }), // Allowed types
        ],
      }),
    )
    file: UploadedFile,
  ) {
    this.logger.debug(`Uploading image to folder: ${folder}, filename: ${file.originalname}`);

    try {
      const url = await this.cloudinaryService.uploadFile(file.buffer, file.originalname, folder);

      this.logger.log(`Image uploaded to ${folder}`);
      return successResponse({ url }, 'Image uploaded successfully', HttpStatus.CREATED);
    } catch (error) {
      this.logger.error(`Upload failed: ${error}`);
      throw new InternalServerErrorException('Failed to upload image to Cloudinary');
    }
  }

  /**
   * Delete images by URL array
   * @param urls - Array of Cloudinary image URLs to delete
   * @returns Success message
   */
  @Delete('images')
  @UseGuards(FlexibleJwtGuard)
  @DeleteImagesDecorator('Delete images by URLs')
  async deleteImages(@Body() { urls }: DeleteImageDto) {
    this.logger.debug(`Deleting ${urls.length} images`);

    if (!urls || urls.length === 0) {
      this.logger.warn('No URLs provided for deletion');
      return successResponse(null, 'No images to delete', HttpStatus.OK);
    }

    const success = await this.cloudinaryService.deleteMultipleFilesByUrls(urls);

    if (!success) {
      this.logger.warn(`Some images failed to delete`);
    } else {
      this.logger.log(`Images deleted successfully`);
    }

    return successResponse(
      null,
      success ? 'Images deleted successfully' : 'Some images failed to delete',
      HttpStatus.OK,
    );
  }
}
