import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ fileName: string }> }
) {
  try {
    const { fileName } = await params;
    
    // Prevent directory traversal
    const safeFileName = path.basename(fileName);
    const filePath = path.join(process.cwd(), 'public', 'screenshots', safeFileName);

    if (!fs.existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    
    // Send the image with standard cache-control headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, must-revalidate',
      },
    });
  } catch (error) {
    console.error('[API Screenshots] Error serving file:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
