import { NextResponse } from 'next/server';
import { createImageMappingService } from '@/lib/image-mapping-service';

export async function GET(request: Request) {
  try {
    const imageMappingService = createImageMappingService();

    // Get image statistics
    const stats = await imageMappingService.getImageStatistics();

    // Get image mapping
    const mapping = await imageMappingService.mapImagesToProducts();

    return NextResponse.json({
      success: true,
      statistics: stats,
      mapping: {
        mainImages: mapping.mainImages,
        backImages: mapping.backImages,
        galleryImages: mapping.galleryImages,
        orphanedImages: mapping.orphanedImages
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Image mapping test error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}