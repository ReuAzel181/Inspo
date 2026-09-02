import { NextRequest, NextResponse } from 'next/server';
import { getReferenceById, updateReference, deleteReference } from '@/lib/localDb';
import { saveUploadedImage } from '@/lib/upload';

type RouteParams = Promise<{ id: string }>;

// GET /api/references/[id] - Get single reference
export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { id } = await params;

    const reference = await getReferenceById(id);

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(reference);
  } catch (error) {
    console.error('GET /api/references/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reference' },
      { status: 500 }
    );
  }
}

// PATCH /api/references/[id] - Update reference
export async function PATCH(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updates = { ...body };

    if (body.thumbnailDataUrl) {
      const thumbnailUrl = await saveUploadedImage(body.thumbnailDataUrl, id, 'cover');
      if (thumbnailUrl) {
        updates.thumbnailUrl = thumbnailUrl;
        updates.screenshotUrl = thumbnailUrl;
      }
      delete updates.thumbnailDataUrl;
    }

    if (Array.isArray(body.additionalImageDataUrls)) {
      const additionalImageUrls = await Promise.all(
        body.additionalImageDataUrls.map(async (image: unknown, index: number) => {
          if (typeof image !== 'string') return '';
          if (!image.startsWith('data:image/')) return image;
          return saveUploadedImage(image, id, `additional-${index}`);
        })
      );

      updates.additionalImageUrls = additionalImageUrls.filter(Boolean);
      delete updates.additionalImageDataUrls;
    }

    if (Array.isArray(body.additionalImagePositions)) {
      updates.additionalImagePositions = body.additionalImagePositions;
    }

    const reference = await updateReference(id, 'user-1', updates);

    return NextResponse.json(reference);
  } catch (error) {
    console.error('PATCH /api/references/[id] error:', error);

    if (error instanceof Error && error.message === 'Reference not found') {
      return NextResponse.json(
        { error: 'Reference not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update reference' },
      { status: 500 }
    );
  }
}

// DELETE /api/references/[id] - Delete reference
export async function DELETE(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { id } = await params;

    const success = await deleteReference(id, 'user-1');

    if (!success) {
      return NextResponse.json(
        { error: 'Reference not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/references/[id] error:', error);
    return NextResponse.json(
      { error: 'Failed to delete reference' },
      { status: 500 }
    );
  }
}
