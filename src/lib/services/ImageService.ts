import { Storage, Databases } from 'appwrite';
import { ProductImage } from '@/lib/repositories/ProductRepository';
import { PRODUCT_IMAGES_BUCKET_ID } from '@/lib/appwrite';

// Image transformation and optimization types
export interface ImageTransform {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

export interface ImageProcessingOptions {
  transforms?: ImageTransform[];
  generateThumbnails?: boolean;
  thumbnailSizes?: Array<{ width: number; height: number; suffix: string }>;
  lazyLoading?: boolean;
}

export interface ProcessedImage {
  original: ProductImage;
  url: string;
  thumbnailUrls: Record<string, string>;
  optimizedUrls: Record<string, string>;
  dominantColor?: string;
  width?: number;
  height?: number;
}

// Image service interface
export interface IImageService {
  processProductImages(images: ProductImage[], options?: ImageProcessingOptions): Promise<ProcessedImage[]>;
  getImageUrl(image: ProductImage, transforms?: ImageTransform[]): string;
  getThumbnailUrl(image: ProductImage, size: string): string;
  preloadImage(url: string): Promise<void>;
  getPlaceholderImage(type?: 'main' | 'gallery' | 'variation'): string;
}

// Implementation of the image service
export class ImageService implements IImageService {
  private storage: Storage;
  private databases: Databases;

  // Default thumbnail configurations
  private readonly defaultThumbnailSizes = {
    thumb: { width: 150, height: 150 },
    small: { width: 320, height: 320 },
    medium: { width: 640, height: 640 },
    large: { width: 1024, height: 1024 }
  };

  // Placeholder images for different scenarios
  private readonly placeholders = {
    main: '/images/placeholders/product-main.jpg',
    gallery: '/images/placeholders/product-gallery.jpg',
    variation: '/images/placeholders/product-variation.jpg'
  };

  constructor(storage: Storage, databases: Databases) {
    this.storage = storage;
    this.databases = databases;
  }

  async processProductImages(
    images: ProductImage[],
    options: ImageProcessingOptions = {}
  ): Promise<ProcessedImage[]> {
    const { transforms = [], generateThumbnails = true } = options;

    return Promise.all(
      images.filter(img => img.is_active).map(async (image) => {
        try {
          let processedUrl = image.url;
          const thumbnailUrls: Record<string, string> = {};
          const optimizedUrls: Record<string, string> = {};

          // Generate thumbnail URLs if requested
          if (generateThumbnails) {
            Object.entries(this.defaultThumbnailSizes).forEach(([size, dimensions]) => {
              thumbnailUrls[size] = this.getThumbnailUrl(image, size);
            });
          }

          // Generate optimized URLs with transforms
          if (transforms.length > 0) {
            transforms.forEach(transform => {
              const transformKey = this.getTransformKey(transform);
              optimizedUrls[transformKey] = this.getImageUrl(image, [transform]);
            });
          }

          // Get actual image URL from Appwrite storage using file_id
          if (image.file_id) {
            try {
              // Use the storage service to get the actual file URL
              processedUrl = this.storage.getFileView(PRODUCT_IMAGES_BUCKET_ID, image.file_id);
              console.log(`✅ Retrieved image URL for ${image.file_id}:`, processedUrl);

              // Validate that the URL is accessible
              if (processedUrl && processedUrl.includes('localhost')) {
                // For local development, ensure the URL is properly formatted
                processedUrl = processedUrl.replace(/\/v1\/storage\/buckets\/[^\/]+\/files\/([^\/]+)\/view/, '/api/storage/files/$1');
              }
            } catch (error) {
              console.warn(`❌ Failed to get storage URL for ${image.file_id}:`, error);
              // Fallback to the provided URL or placeholder
              processedUrl = image.url && image.url.startsWith('http')
                ? image.url
                : this.getPlaceholderImage(image.image_type);
            }
          } else if (image.url && image.url.startsWith('http')) {
            // Use provided URL if it's already a valid HTTP URL
            processedUrl = image.url;
            console.log(`🔗 Using provided URL:`, processedUrl);
          } else {
            // Use placeholder for images without file_id or valid URL
            console.log(`📷 Using placeholder for image type: ${image.image_type}`);
            processedUrl = this.getPlaceholderImage(image.image_type);
          }

          return {
            original: image,
            url: processedUrl,
            thumbnailUrls,
            optimizedUrls,
            dominantColor: await this.extractDominantColor(image)
          };
        } catch (error) {
          console.error(`❌ Error processing image ${image.id}:`, error);

          // Return fallback image data
          return {
            original: image,
            url: this.getPlaceholderImage(image.image_type),
            thumbnailUrls: {},
            optimizedUrls: {}
          };
        }
      })
    );
  }

  getImageUrl(image: ProductImage, transforms: ImageTransform[] = []): string {
    // If no file_id, return the provided URL or placeholder
    if (!image.file_id) {
      const url = image.url && image.url.startsWith('http') ? image.url : this.getPlaceholderImage(image.image_type);
      console.log(`📷 No file_id, using:`, url);
      return url;
    }

    // If no transforms, return direct storage URL
    if (transforms.length === 0) {
      try {
        const url = this.storage.getFileView(PRODUCT_IMAGES_BUCKET_ID, image.file_id);
        console.log(`🔗 Generated Appwrite storage URL for ${image.file_id}:`, url);

        // Convert Appwrite URL to our custom storage API format
        const convertedUrl = this.convertAppwriteUrlToStorageApi(url, image.file_id);
        console.log(`🔄 Converted to storage API URL:`, convertedUrl);
        return convertedUrl;
      } catch (error) {
        console.warn(`❌ Failed to get storage URL for ${image.file_id}:`, error);
        // Fallback to provided URL if available
        if (image.url && image.url.startsWith('http')) {
          return image.url;
        }
        return this.getPlaceholderImage(image.image_type);
      }
    }

    // For transformed images, try to use storage preview if available
    try {
      // Appwrite storage doesn't support advanced transformations like Cloudinary
      // So we'll return the basic storage URL for now
      const baseUrl = this.storage.getFileView(PRODUCT_IMAGES_BUCKET_ID, image.file_id);

      // Convert Appwrite URL to our custom storage API format
      const convertedUrl = this.convertAppwriteUrlToStorageApi(baseUrl, image.file_id);
      console.log(`🔗 Generated transformed URL for ${image.file_id}:`, convertedUrl);
      return convertedUrl;
    } catch (error) {
      console.warn(`❌ Failed to get transformed URL for ${image.file_id}:`, error);
      // Fallback to provided URL if available
      if (image.url && image.url.startsWith('http')) {
        return image.url;
      }
      return this.getPlaceholderImage(image.image_type);
    }
  }

  private convertAppwriteUrlToStorageApi(appwriteUrl: string, fileId: string): string {
    // Convert Appwrite storage URL format to our custom storage API format
    // Appwrite format: https://cloud.appwrite.io/v1/storage/buckets/{bucketId}/files/{fileId}/view
    // Our format: /api/storage/files/{fileId}

    if (appwriteUrl.includes('localhost')) {
      // For local development, use our storage API
      return `/api/storage/files/${fileId}`;
    }

    // For production Appwrite, try to extract file path or use our API
    // This is a fallback - ideally we'd store the actual file path in the database
    return `/api/storage/files/${fileId}`;
  }

  getThumbnailUrl(image: ProductImage, size: string): string {
    const dimensions = this.defaultThumbnailSizes[size as keyof typeof this.defaultThumbnailSizes];
    if (!dimensions || !image.file_id) {
      console.log(`📷 Generating placeholder for thumbnail, size: ${size}`);
      return this.getPlaceholderImage(image.image_type);
    }

    const url = this.getImageUrl(image, [{
      width: dimensions.width,
      height: dimensions.height,
      fit: 'cover',
      quality: 80
    }]);

    console.log(`🖼️ Generated thumbnail URL for ${image.file_id}, size ${size}:`, url);
    return url;
  }

  async preloadImage(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to preload image: ${url}`));
      img.src = url;
    });
  }

  getPlaceholderImage(type: 'main' | 'gallery' | 'variation' = 'main'): string {
    return this.placeholders[type] || this.placeholders.main;
  }

  private buildTransformString(transforms: ImageTransform[]): string {
    return transforms.map(transform => {
      const parts: string[] = [];

      if (transform.width) parts.push(`w_${transform.width}`);
      if (transform.height) parts.push(`h_${transform.height}`);
      if (transform.quality) parts.push(`q_${transform.quality}`);
      if (transform.format) parts.push(`f_${transform.format}`);
      if (transform.fit) parts.push(`fit_${transform.fit}`);

      return parts.join(',');
    }).join('/');
  }

  private getTransformKey(transform: ImageTransform): string {
    const parts: string[] = [];

    if (transform.width) parts.push(`w${transform.width}`);
    if (transform.height) parts.push(`h${transform.height}`);
    if (transform.quality) parts.push(`q${transform.quality}`);
    if (transform.format) parts.push(`f${transform.format}`);
    if (transform.fit) parts.push(`fit${transform.fit}`);

    return parts.join('_');
  }

  private async extractDominantColor(image: ProductImage): Promise<string | undefined> {
    // Placeholder implementation for dominant color extraction
    // In a real implementation, you would:
    // 1. Load the image
    // 2. Use a color extraction algorithm (like color-thief)
    // 3. Return the dominant color

    try {
      // For now, return a default color based on image type
      const colorMap: Record<string, string> = {
        main: '#f3f4f6',
        gallery: '#e5e7eb',
        variation: '#d1d5db'
      };

      return colorMap[image.image_type] || '#f3f4f6';
    } catch (error) {
      console.warn('Error extracting dominant color:', error);
      return '#f3f4f6';
    }
  }
}

// Factory function for creating image service instances
export const createImageService = (storage: Storage, databases: Databases): IImageService => {
  return new ImageService(storage, databases);
};