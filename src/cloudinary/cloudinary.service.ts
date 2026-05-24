import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService implements OnModuleInit {
  constructor(private config: ConfigService) {}

  onModuleInit() {
    const cloudName = this.config.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get('CLOUDINARY_API_SECRET');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
      console.log('✅ Cloudinary configured');
    } else {
      console.warn('⚠️ Cloudinary credentials not set — image upload disabled');
    }
  }

  isEnabled(): boolean {
    const c = cloudinary.config();
    return !!(c.cloud_name && c.api_key && c.api_secret);
  }

  uploadFile(buffer: Buffer, folder: string): Promise<UploadApiResponse> {
    if (!this.isEnabled()) throw new Error('Image upload is not configured');

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `threadly/${folder}`, resource_type: 'image' },
        (err, result) => {
          if (err || !result) return reject(new Error('Upload failed'));
          resolve(result);
        },
      );
      Readable.from(buffer).pipe(stream);
    });
  }

  async deleteFile(url: string): Promise<void> {
    if (!this.isEnabled()) return;
    const parts = url.split('/');
    const file = parts[parts.length - 1].split('.')[0];
    const folder = parts[parts.length - 2];
    await cloudinary.uploader.destroy(`threadly/${folder}/${file}`);
  }
}
