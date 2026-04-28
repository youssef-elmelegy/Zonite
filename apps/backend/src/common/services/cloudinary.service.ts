import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '@/env';

interface CloudinaryUploadResponse {
  secure_url: string;
}

interface CloudinaryDeleteResponse {
  result: 'ok' | 'not found';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null) {
    return JSON.stringify(error);
  }
  return 'Unknown error';
}

/**
 * Cloudinary Service
 * Handles file uploads to Cloudinary
 */
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor() {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
    this.logger.debug('Cloudinary configured successfully');
  }

  /**
   * Upload a single file to Cloudinary
   * @param buffer - File buffer to upload
   * @param originalFilename - Original filename with extension
   * @param folder - Folder path in Cloudinary (default: "Zonite")
   * @returns Secure URL of uploaded file
   */
  async uploadFile(
    buffer: Buffer,
    originalFilename: string,
    folder: string = 'Zonite',
  ): Promise<string> {
    const publicId = `${Date.now()}-${originalFilename.split('.')[0]}`;

    return new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: publicId,
          resource_type: 'auto',
        },
        (error: unknown, result: CloudinaryUploadResponse | undefined) => {
          if (error) {
            const err = new Error(`Upload failed: ${getErrorMessage(error)}`);
            reject(err);
            return;
          }
          if (!result) {
            reject(new Error('Upload returned no result'));
            return;
          }
          this.logger.debug(`File uploaded: ${publicId}`);
          resolve(result.secure_url);
        },
      );

      stream.on('error', (error: unknown) => {
        const err = new Error(`Stream error: ${getErrorMessage(error)}`);
        reject(err);
      });

      stream.end(buffer);
    }).catch((err) => {
      this.logger.error(`Upload error: ${getErrorMessage(err)}`);
      throw err;
    });
  }

  /**
   * Upload multiple files to Cloudinary
   * @param files - Array of file buffers with names
   * @param folder - Folder path in Cloudinary (default: "Zonite")
   * @returns Array of secure URLs
   */
  async uploadMultipleFiles(
    files: { buffer: Buffer; originalFilename: string }[],
    folder: string = 'Zonite',
  ): Promise<string[]> {
    this.logger.debug(`Uploading ${files.length} files to folder: ${folder}`);
    const uploadPromises = files.map((file) =>
      this.uploadFile(file.buffer, file.originalFilename, folder),
    );
    return Promise.all(uploadPromises);
  }

  /**
   * Delete a file from Cloudinary by URL
   * @param url - Cloudinary secure URL
   * @returns true if deleted successfully
   */
  async deleteFileByUrl(url: string): Promise<boolean> {
    const publicId = this.extractPublicIdFromUrl(url);
    return this.deleteFile(publicId);
  }

  /**
   * Delete multiple files from Cloudinary by URLs
   * @param urls - Array of Cloudinary secure URLs
   * @returns true if all deletions successful
   */
  async deleteMultipleFilesByUrls(urls: string[]): Promise<boolean> {
    this.logger.debug(`Deleting ${urls.length} files from Cloudinary`);
    const publicIds = urls.map((url) => this.extractPublicIdFromUrl(url));
    const results = await Promise.allSettled(publicIds.map((id) => this.deleteFile(id)));
    return results.every((r) => r.status === 'fulfilled' && r.value);
  }

  /**
   * Delete a file from Cloudinary by public_id
   * @param publicId - Cloudinary public_id
   * @returns true if deleted successfully
   */
  private deleteFile(publicId: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      cloudinary.uploader.destroy(
        publicId,
        (error: unknown, result: CloudinaryDeleteResponse | undefined) => {
          if (error) {
            this.logger.error(`Delete failed for ${publicId}: ${getErrorMessage(error)}`);
            resolve(false);
          } else if (result) {
            this.logger.debug(`File deleted: ${publicId}`);
            resolve(result.result === 'ok');
          } else {
            resolve(false);
          }
        },
      );
    }).catch((err) => {
      this.logger.error(`Delete error: ${getErrorMessage(err)}`);
      return false;
    });
  }

  /**
   * Extract public_id from Cloudinary URL
   * @param url - Cloudinary secure URL
   * @returns Extracted public_id
   */
  private extractPublicIdFromUrl(url: string): string {
    const uploadIndex = url.indexOf('/upload/');
    if (uploadIndex !== -1) {
      const afterUpload = url.substring(uploadIndex + 8);
      const publicIdWithoutExt = afterUpload.substring(0, afterUpload.lastIndexOf('.'));

      const versionMatch = publicIdWithoutExt.match(/^v\d+\//);
      if (versionMatch) {
        return publicIdWithoutExt.substring(versionMatch[0].length);
      }

      return publicIdWithoutExt;
    }

    const parts = url.split('/');
    const fileWithFormat = parts[parts.length - 1];
    return fileWithFormat.split('.')[0];
  }
}
