import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { createImageService } from '@/lib/image-service';
import { storage, databases } from '@/lib/appwrite';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const productId = formData.get('productId') as string;
    const folder = formData.get('folder') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // For new product creation, generate a temporary ID if not provided
    const finalProductId = productId || `temp_${Date.now()}_${Math.random().toString(36).substring(2)}`;

    // Create image service instance
    const imageService = createImageService(storage, databases);

    // Upload the file using the image service
    const uploadResult = await imageService.uploadFromFile(file, {
      folder: folder || `products/${finalProductId}`,
      generateThumbnails: true,
      quality: 80,
      format: 'webp'
    });

    return NextResponse.json(uploadResult, { status: 200 });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    );
  }
}