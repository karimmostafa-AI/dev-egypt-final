import { NextResponse } from 'next/server';
import { createImageValidationService } from '@/lib/image-validation-service';
import { createServerClient } from '@/lib/appwrite';
import { Databases, Query } from 'node-appwrite';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'overview';

    const imageValidationService = createImageValidationService();

    switch (action) {
      case 'missing-images':
        // Get all image references from database
        const serverClient = createServerClient();
        const databases = new Databases(serverClient);

        // This would need to be adjusted based on your actual database schema
        // For now, we'll focus on filesystem validation
        const availableImages = await imageValidationService.getAvailableImages();

        return NextResponse.json({
          success: true,
          action: 'missing-images',
          availableImages,
          count: availableImages.length,
          timestamp: new Date().toISOString()
        });

      case 'validate-reference':
        const imageRef = searchParams.get('image');
        if (!imageRef) {
          return NextResponse.json({
            success: false,
            error: 'Image reference parameter is required'
          }, { status: 400 });
        }

        const exists = await imageValidationService.imageExists(imageRef);

        return NextResponse.json({
          success: true,
          action: 'validate-reference',
          imageReference: imageRef,
          exists,
          timestamp: new Date().toISOString()
        });

      case 'overview':
      default:
        const allImages = await imageValidationService.getAvailableImages();

        return NextResponse.json({
          success: true,
          action: 'overview',
          totalImages: allImages.length,
          images: allImages.slice(0, 50), // Return first 50 for overview
          timestamp: new Date().toISOString()
        });
    }

  } catch (error: any) {
    console.error('Image validation error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imageReferences } = body;

    if (!Array.isArray(imageReferences)) {
      return NextResponse.json({
        success: false,
        error: 'imageReferences must be an array'
      }, { status: 400 });
    }

    const imageValidationService = createImageValidationService();
    const validation = await imageValidationService.validateImageReferences(imageReferences);

    return NextResponse.json({
      success: true,
      validation,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Image validation POST error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}