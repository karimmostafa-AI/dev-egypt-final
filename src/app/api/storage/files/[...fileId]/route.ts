import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string[] }> }
) {
  try {
    const { fileId } = await params;
    let filePathParam = fileId.join('/');

    // Enhanced logging to track image requests
    console.log('=== Image Request Debug ===');
    console.log('Requested fileId:', fileId);
    console.log('Joined filePath:', filePathParam);
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    console.log('Request URL:', request.url);
    console.log('User-Agent:', request.headers.get('user-agent'));
    console.log('Referer:', request.headers.get('referer'));
    console.log('Full request path:', request.nextUrl.pathname);

    // Handle the /view suffix if present (legacy support)
    if (filePathParam.endsWith('/view')) {
      filePathParam = filePathParam.slice(0, -5); // Remove '/view'
    }

    // Handle different file extensions and paths
    let filePath = '';
    let foundFile = false;

    // First, try to find the file in the uploads/images directory
    const possibleExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'images');

    // If filePathParam contains path separators, treat it as a nested path
    if (filePathParam.includes('/') || filePathParam.includes('\\')) {
      // Handle nested paths like "products/temp_1759968438845_z8pkz52xh1b/t60_2411020_1-1759968438847-kanxliai4n.webp"
      const directPath = path.join(uploadsDir, filePathParam);
      try {
        await fs.access(directPath);
        filePath = directPath;
        foundFile = true;
      } catch {
        // File doesn't exist at nested path
      }
    } else {
      // Handle simple filenames
      for (const ext of possibleExtensions) {
        const testPath = path.join(uploadsDir, filePathParam + ext);
        try {
          await fs.access(testPath);
          filePath = testPath;
          foundFile = true;
          break;
        } catch {
          // File doesn't exist with this extension, try next one
        }
      }

      // If not found with extension, try the exact filename as provided
      if (!foundFile) {
        const directPath = path.join(uploadsDir, filePathParam);
        try {
          await fs.access(directPath);
          filePath = directPath;
          foundFile = true;
        } catch {
          // File doesn't exist
        }
      }

      // Also check in products subdirectory
      if (!foundFile) {
        for (const ext of possibleExtensions) {
          const testPath = path.join(uploadsDir, 'products', filePathParam + ext);
          try {
            await fs.access(testPath);
            filePath = testPath;
            foundFile = true;
            break;
          } catch {
            // File doesn't exist with this extension, try next one
          }
        }
      }
    }

    if (!foundFile) {
      // Enhanced logging for missing files
      console.error('=== FILE NOT FOUND ===');
      console.error('Requested file:', filePathParam);
      console.error('Searched paths:');
      console.error('- uploads/images/' + filePathParam);
      if (filePathParam.includes('/') || filePathParam.includes('\\')) {
        console.error('- uploads/images/' + filePathParam);
      } else {
        possibleExtensions.forEach(ext => {
          console.error('- uploads/images/' + filePathParam + ext);
          console.error('- uploads/images/products/' + filePathParam + ext);
        });
      }
      console.error('Available files in uploads/images:');
      try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'images');
        const files = await fs.readdir(uploadsDir);
        console.error('Available files:', files);
      } catch (error) {
        console.error('Error reading directory:', error);
      }

      // Return a fallback response instead of 404
      return new NextResponse(
        `<!-- Fallback for missing image: ${filePathParam} -->`,
        {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache',
            'X-Fallback-Image': 'true'
          },
        }
      );
    }

    // Read the file
    const fileBuffer = await fs.readFile(filePath);

    // Determine content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'application/octet-stream';

    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
    }

    // Return the file with appropriate headers
    return new NextResponse(Buffer.from(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': fileBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error serving file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}