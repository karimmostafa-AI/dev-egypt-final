import { ID, Storage, Databases } from 'appwrite';

// Types for the image service
interface UploadOptions {
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  generateThumbnails?: boolean;
  thumbnailSizes?: ThumbnailSize[];
  altText?: string;
  folder?: string;
}

export interface ThumbnailSize {
  width: number;
  height: number;
  suffix: string;
}

export interface UploadResult {
  id: string;
  originalName: string;
  fileName: string;
  url: string;
  cdnUrl?: string;
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
  thumbnails: Thumbnail[];
  dominantColor?: string;
  metadataId: string;
}

export interface Thumbnail {
  size: string;
  url: string;
  width: number;
  height: number;
}

export interface OptimizationOptions {
  quality: number;
  format: 'webp' | 'avif' | 'jpeg' | 'png';
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
}

export interface Transformation {
  width?: number;
  height?: number;
  quality?: number;
  format?: string;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface ImageUploadService {
  uploadFromFile(file: File, options?: UploadOptions): Promise<UploadResult>;
  uploadFromUrl(url: string, options?: UploadOptions): Promise<UploadResult>;
  uploadMultiple(files: File[], options?: UploadOptions): Promise<UploadResult[]>;

  optimizeImage(imageBuffer: ArrayBuffer, options: OptimizationOptions): Promise<ArrayBuffer>;
  generateThumbnails(imageBuffer: ArrayBuffer, sizes: ThumbnailSize[]): Promise<Thumbnail[]>;

  implementLazyLoading(imageElement: HTMLImageElement): void;

  cacheImage(imageUrl: string, duration: number): Promise<void>;
  invalidateCache(imageUrl: string): Promise<void>;
  getCDNUrl(imageId: string, transformations?: Transformation[]): string;
}

class AdvancedImageService implements ImageUploadService {
  private storage: Storage;
  private databases: Databases;

  // Storage configuration
  private readonly storageStrategy = {
    local: {
      path: './public/uploads',
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['jpg', 'jpeg', 'png', 'webp', 'avif']
    },
    cloud: {
      provider: 'cloudinary', // or AWS S3, etc.
      bucket: 'dev-egypt-images',
      cdn: 'https://cdn.devegypt.com'
    },
    hybrid: {
      localForThumbnails: true,
      cloudForOriginals: true,
      cacheStrategy: 'redis'
    }
  };

  // Default thumbnail sizes
  private readonly defaultThumbnailSizes: ThumbnailSize[] = [
    { width: 150, height: 150, suffix: 'thumb' },
    { width: 320, height: 320, suffix: 'small' },
    { width: 640, height: 640, suffix: 'medium' },
    { width: 1024, height: 1024, suffix: 'large' },
    { width: 1920, height: 1920, suffix: 'xlarge' }
  ];

  constructor(storage: Storage, databases: Databases) {
    this.storage = storage;
    this.databases = databases;
  }

  async uploadFromFile(file: File, options: UploadOptions = {}): Promise<UploadResult> {
    try {
      // Validate file
      this.validateFile(file);

      // Generate unique filename
      const fileName = this.generateFileName(file.name, options.folder);

      // For local storage approach, save to public/uploads/images directory
      // Check if we're in a Node.js environment (server-side)
      if (typeof window === 'undefined' && typeof process !== 'undefined' && process.cwd) {
        // Server-side environment - save file to disk
        const fs = await import('fs/promises');
        const path = await import('path');

        // Ensure uploads directory exists
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'images');
        await fs.mkdir(uploadsDir, { recursive: true });

        // Convert File to ArrayBuffer for saving
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Save file to local storage
        const filePath = path.join(uploadsDir, fileName);
        await fs.writeFile(filePath, buffer);

        console.log('Saved file to:', filePath);
      } else {
        // Browser environment - create blob URL for preview
        console.log('Browser environment detected - creating blob URL for preview');
      }

      // Generate thumbnails if requested
      const thumbnails: Thumbnail[] = [];
      if (options.generateThumbnails !== false) {
        const thumbnailSizes = options.thumbnailSizes || this.defaultThumbnailSizes;
        thumbnails.push(...this.createPlaceholderThumbnails(fileName, thumbnailSizes));
      }

      // Extract dominant color (placeholder implementation)
      const dominantColor = await this.extractDominantColor(file);

      return {
        id: fileName, // Use filename as ID for local storage
        originalName: file.name,
        fileName,
        url: `/api/storage/files/${fileName}/view`,
        cdnUrl: `/uploads/images/${fileName}`,
        width: 0, // Would be extracted from image
        height: 0, // Would be extracted from image
        fileSize: file.size,
        mimeType: file.type,
        thumbnails,
        dominantColor,
        metadataId: `meta_${Date.now()}_${Math.random().toString(36).substring(2)}`
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async uploadFromUrl(url: string, options: UploadOptions = {}): Promise<UploadResult> {
    try {
      // Fetch image from URL
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
      }

      const blob = await response.blob();
      const fileName = this.extractFileNameFromUrl(url);
      const file = new File([blob], fileName, { type: blob.type });

      return this.uploadFromFile(file, options);
    } catch (error) {
      console.error('Error uploading from URL:', error);
      throw new Error(`Failed to upload from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async uploadMultiple(files: File[], options: UploadOptions = {}): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const file of files) {
      try {
        const result = await this.uploadFromFile(file, options);
        results.push(result);
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        // Continue with other files
      }
    }

    return results;
  }

  async optimizeImage(imageBuffer: ArrayBuffer, options: OptimizationOptions): Promise<ArrayBuffer> {
    // Placeholder implementation - in a real scenario, you'd use a library like sharp
    // to optimize the image based on the options provided
    console.log('Optimizing image with options:', options);

    // For now, return the original buffer
    // In production, this would:
    // 1. Resize image if width/height specified
    // 2. Convert to specified format
    // 3. Adjust quality
    // 4. Maintain aspect ratio if requested

    return imageBuffer;
  }

  async generateThumbnails(imageBuffer: ArrayBuffer, sizes: ThumbnailSize[]): Promise<Thumbnail[]> {
    // Placeholder implementation - in production, this would generate actual thumbnails
    const thumbnails: Thumbnail[] = [];

    for (const size of sizes) {
      thumbnails.push({
        size: size.suffix,
        url: `/thumbnails/placeholder-${size.suffix}.jpg`,
        width: size.width,
        height: size.height
      });
    }

    return thumbnails;
  }

  implementLazyLoading(imageElement: HTMLImageElement): void {
    if ('loading' in HTMLImageElement.prototype) {
      // Native lazy loading support
      imageElement.loading = 'lazy';
    } else {
      // Fallback for browsers without native lazy loading
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.classList.remove('lazy');
              observer.unobserve(img);
            }
          }
        });
      });

      if (imageElement.dataset.src) {
        imageObserver.observe(imageElement);
      }
    }
  }

  async cacheImage(imageUrl: string, duration: number): Promise<void> {
    // Placeholder implementation for caching
    // In production, this would integrate with Redis or another caching strategy
    console.log(`Caching image ${imageUrl} for ${duration} seconds`);
  }

  async invalidateCache(imageUrl: string): Promise<void> {
    // Placeholder implementation for cache invalidation
    console.log(`Invalidating cache for image ${imageUrl}`);
  }

  getCDNUrl(imageId: string, transformations: Transformation[] = []): string {
    const baseUrl = this.storageStrategy.cloud.cdn;
    const transformString = transformations.length > 0
      ? `/${this.buildTransformationString(transformations)}`
      : '';

    return `${baseUrl}/${transformString}${imageId}`;
  }

  private validateFile(file: File): void {
    const maxSize = this.storageStrategy.local.maxSize;
    const allowedTypes = this.storageStrategy.local.allowedTypes;

    if (file.size > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      throw new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }
  }

  private generateFileName(originalName: string, folder?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const extension = originalName.split('.').pop();
    const baseName = originalName.replace(`.${extension}`, '');

    const folderPrefix = folder ? `${folder}/` : '';
    return `${folderPrefix}${baseName}-${timestamp}-${random}.${extension}`;
  }

  private extractFileNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      return pathname.split('/').pop() || 'image.jpg';
    } catch {
      return 'image.jpg';
    }
  }

  private createPlaceholderThumbnails(fileName: string, sizes: ThumbnailSize[]): Thumbnail[] {
    return sizes.map(size => ({
      size: size.suffix,
      url: `/thumbnails/${fileName.replace('.', `-${size.suffix}.`)}`,
      width: size.width,
      height: size.height
    }));
  }

  private async extractDominantColor(file: File): Promise<string | undefined> {
    // Placeholder implementation for dominant color extraction
    // In production, you'd use a library like color-thief or similar
    return '#cccccc';
  }


  private buildTransformationString(transformations: Transformation[]): string {
    const transforms = transformations.map(t => {
      const parts = [];
      if (t.width) parts.push(`w_${t.width}`);
      if (t.height) parts.push(`h_${t.height}`);
      if (t.quality) parts.push(`q_${t.quality}`);
      if (t.format) parts.push(`f_${t.format}`);
      if (t.fit) parts.push(`fit_${t.fit}`);
      return parts.join(',');
    });

    return transforms.join('/');
  }
}

// Factory function to create the service
export const createImageService = (storage: Storage, databases: Databases): ImageUploadService => {
  return new AdvancedImageService(storage, databases);
};

// Types are already exported as interfaces above