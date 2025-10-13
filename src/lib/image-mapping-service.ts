import { promises as fs } from 'fs';
import path from 'path';

/**
 * Image Mapping Service
 * Maps existing uploaded image files to product references
 */
export class ImageMappingService {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'images');
  }

  /**
   * Get all available image files in the uploads directory
   */
  async getAvailableImageFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.uploadsDir);
      return files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext);
      });
    } catch (error) {
      console.error('Error reading image files:', error);
      return [];
    }
  }

  /**
   * Map image files to product image objects
   */
  async mapImagesToProducts(): Promise<{
    mainImages: { [productId: string]: string };
    backImages: { [productId: string]: string };
    galleryImages: { [productId: string]: string[] };
    orphanedImages: string[];
  }> {
    const availableFiles = await this.getAvailableImageFiles();
    const mainImages: { [productId: string]: string } = {};
    const backImages: { [productId: string]: string } = {};
    const galleryImages: { [productId: string]: string[] } = {};
    const usedImages = new Set<string>();

    // Pattern matching for different image types
    for (const file of availableFiles) {
      const fileName = path.parse(file).name;
      const extension = path.parse(file).ext;

      // Check for main images (files ending with _main)
      if (fileName.endsWith('_main')) {
        const productId = fileName.replace('_main', '');
        mainImages[productId] = `/api/storage/files/${file}`;
        usedImages.add(file);
      }

      // Check for back images (files ending with _back)
      if (fileName.endsWith('_back')) {
        const productId = fileName.replace('_back', '');
        backImages[productId] = `/api/storage/files/${file}`;
        usedImages.add(file);
      }

      // Check for gallery images (files with numbers at the end)
      const galleryMatch = fileName.match(/^(.+)_(\d+)$/);
      if (galleryMatch) {
        const [, baseName, number] = galleryMatch;
        if (!baseName.endsWith('_main') && !baseName.endsWith('_back')) {
          if (!galleryImages[baseName]) {
            galleryImages[baseName] = [];
          }
          galleryImages[baseName].push(`/api/storage/files/${file}`);
          usedImages.add(file);
        }
      }
    }

    // Find orphaned images (files that weren't matched to any pattern)
    const orphanedImages = availableFiles.filter(file => !usedImages.has(file));

    return {
      mainImages,
      backImages,
      galleryImages,
      orphanedImages
    };
  }

  /**
   * Generate enhanced product data with proper image URLs
   */
  async enhanceProductWithImages(product: any): Promise<any> {
    const mapping = await this.mapImagesToProducts();

    // Try to find images for this product
    const productId = product.$id || product.id;
    const productSlug = product.slug;

    // Look for images using different matching strategies
    let mainImageUrl = null;
    let backImageUrl = null;
    let galleryImages: string[] = [];

    // Strategy 1: Direct ID match
    if (mapping.mainImages[productId]) {
      mainImageUrl = mapping.mainImages[productId];
    }
    if (mapping.backImages[productId]) {
      backImageUrl = mapping.backImages[productId];
    }
    if (mapping.galleryImages[productId]) {
      galleryImages = mapping.galleryImages[productId];
    }

    // Strategy 2: Slug-based match (if ID didn't work)
    if (!mainImageUrl && productSlug) {
      // Try to find images that might match the slug pattern
      for (const [imageProductId, imageUrl] of Object.entries(mapping.mainImages)) {
        if (imageProductId.includes(productSlug) || productSlug.includes(imageProductId)) {
          mainImageUrl = imageUrl;
          break;
        }
      }
    }

    // Strategy 3: Use any available main image if no specific match found
    if (!mainImageUrl && Object.keys(mapping.mainImages).length > 0) {
      const firstMainImage = Object.values(mapping.mainImages)[0];
      mainImageUrl = firstMainImage;
    }

    // Strategy 4: Use any available back image if no specific match found
    if (!backImageUrl && Object.keys(mapping.backImages).length > 0) {
      const firstBackImage = Object.values(mapping.backImages)[0];
      backImageUrl = firstBackImage;
    }

    return {
      ...product,
      mainImageUrl: mainImageUrl || product.mainImageUrl,
      backImageUrl: backImageUrl || product.backImageUrl,
      galleryImages: galleryImages.length > 0 ? galleryImages : (product.galleryImages || [])
    };
  }

  /**
   * Get image statistics
   */
  async getImageStatistics(): Promise<{
    totalImages: number;
    mainImages: number;
    backImages: number;
    galleryImages: number;
    orphanedImages: number;
    mappedProducts: number;
  }> {
    const mapping = await this.mapImagesToProducts();
    const availableFiles = await this.getAvailableImageFiles();

    // Count different types of images
    const mainCount = Object.keys(mapping.mainImages).length;
    const backCount = Object.keys(mapping.backImages).length;
    const galleryCount = Object.keys(mapping.galleryImages).length;

    // Count unique products that have images
    const mappedProducts = new Set([
      ...Object.keys(mapping.mainImages),
      ...Object.keys(mapping.backImages),
      ...Object.keys(mapping.galleryImages)
    ]).size;

    return {
      totalImages: availableFiles.length,
      mainImages: mainCount,
      backImages: backCount,
      galleryImages: galleryCount,
      orphanedImages: mapping.orphanedImages.length,
      mappedProducts
    };
  }
}

// Factory function to create the service
export const createImageMappingService = (): ImageMappingService => {
  return new ImageMappingService();
};