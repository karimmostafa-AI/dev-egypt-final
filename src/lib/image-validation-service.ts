import { promises as fs } from 'fs';
import path from 'path';

/**
 * Image Validation Service
 * Provides utilities for validating image files and identifying missing references
 */
export class ImageValidationService {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'images');
  }

  /**
   * Check if a specific image file exists
   */
  async imageExists(fileName: string): Promise<boolean> {
    try {
      // Handle different file extensions
      const possibleExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      const possiblePaths = [
        path.join(this.uploadsDir, fileName),
        ...possibleExtensions.map(ext => path.join(this.uploadsDir, fileName + ext)),
        ...possibleExtensions.map(ext => path.join(this.uploadsDir, 'products', fileName + ext))
      ];

      // Handle nested paths
      if (fileName.includes('/') || fileName.includes('\\')) {
        possiblePaths.push(path.join(this.uploadsDir, fileName));
      }

      for (const testPath of possiblePaths) {
        try {
          await fs.access(testPath);
          return true;
        } catch {
          // File doesn't exist, try next path
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking image existence:', error);
      return false;
    }
  }

  /**
   * Get all available image files in the uploads directory
   */
  async getAvailableImages(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.uploadsDir);
      const allFiles: string[] = [];

      for (const file of files) {
        const filePath = path.join(this.uploadsDir, file);
        const stat = await fs.stat(filePath);

        if (stat.isDirectory()) {
          // Recursively get files from subdirectories
          const subFiles = await this.getFilesFromDirectory(filePath);
          allFiles.push(...subFiles.map(f => path.relative(this.uploadsDir, f)));
        } else {
          allFiles.push(file);
        }
      }

      return allFiles;
    } catch (error) {
      console.error('Error getting available images:', error);
      return [];
    }
  }

  /**
   * Find orphaned image references (files that exist but aren't referenced in database)
   */
  async findOrphanedImages(referencedImages: string[]): Promise<string[]> {
    const availableImages = await this.getAvailableImages();
    const orphaned: string[] = [];

    for (const availableImage of availableImages) {
      const isReferenced = referencedImages.some(ref => {
        const refFileName = ref.split('/').pop();
        const availableFileName = availableImage.split('/').pop();
        return refFileName === availableFileName;
      });

      if (!isReferenced) {
        orphaned.push(availableImage);
      }
    }

    return orphaned;
  }

  /**
   * Find missing image references (referenced but don't exist)
   */
  async findMissingImages(referencedImages: string[]): Promise<string[]> {
    const missing: string[] = [];

    for (const referencedImage of referencedImages) {
      const exists = await this.imageExists(referencedImage);
      if (!exists) {
        missing.push(referencedImage);
      }
    }

    return missing;
  }

  /**
   * Validate and clean up image references
   */
  async validateImageReferences(imageReferences: string[]): Promise<{
    valid: string[];
    missing: string[];
    suggestions: { [missing: string]: string };
  }> {
    const valid: string[] = [];
    const missing: string[] = [];
    const suggestions: { [missing: string]: string } = {};

    for (const ref of imageReferences) {
      const exists = await this.imageExists(ref);
      if (exists) {
        valid.push(ref);
      } else {
        missing.push(ref);

        // Try to find similar files as suggestions
        const availableImages = await this.getAvailableImages();
        const similarFiles = availableImages.filter(img => {
          const refName = ref.toLowerCase();
          const imgName = img.toLowerCase();
          return imgName.includes(refName) || refName.includes(imgName);
        });

        if (similarFiles.length > 0) {
          suggestions[ref] = similarFiles[0];
        }
      }
    }

    return { valid, missing, suggestions };
  }

  /**
   * Helper method to recursively get files from directory
   */
  private async getFilesFromDirectory(dirPath: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const items = await fs.readdir(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = await fs.stat(itemPath);

        if (stat.isDirectory()) {
          const subFiles = await this.getFilesFromDirectory(itemPath);
          files.push(...subFiles);
        } else {
          files.push(itemPath);
        }
      }
    } catch (error) {
      console.error('Error reading directory:', error);
    }

    return files;
  }
}

// Factory function to create the service
export const createImageValidationService = (): ImageValidationService => {
  return new ImageValidationService();
};