import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params;

    if (!fileId) {
      return new NextResponse('File ID is required', { status: 400 });
    }

    // Define local storage paths
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'images');
    const filePath = path.join(uploadsDir, fileId);

    console.log('Looking for file:', filePath);

    // Check if file exists
    let fileBuffer: Buffer;
    let contentType = 'application/octet-stream';

    try {
      fileBuffer = await fs.readFile(filePath);

      // Determine content type based on file extension
      const ext = path.extname(fileId).toLowerCase();
      const contentTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.avif': 'image/avif'
      };
      contentType = contentTypes[ext] || contentType;

    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // Generate a placeholder image if file doesn't exist
        const placeholderSvg = `<svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f3f4f6"/>
          <text x="50%" y="50%" text-anchor="middle" dy=".3em" font-family="Arial, sans-serif" font-size="14" fill="#6b7280">
            No Image
          </text>
        </svg>`;

        fileBuffer = Buffer.from(placeholderSvg, 'utf-8');
        contentType = 'image/svg+xml';
      } else {
        throw error;
      }
    }

    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable'); // Cache for 1 year
    headers.set('Content-Length', fileBuffer.length.toString());

    return new NextResponse(Buffer.from(fileBuffer), {
      status: 200,
      headers,
    });

  } catch (error: any) {
    console.error('Error serving file:', error);

    // Return appropriate error responses
    if (error.code === 'ENOENT' || error.message?.includes('File not found')) {
      return new NextResponse('File not found', { status: 404 });
    }

    if (error.message?.includes('Access denied') || error.code === 'EACCES') {
      return new NextResponse('Access denied', { status: 403 });
    }

    return new NextResponse('Internal server error', { status: 500 });
  }
}