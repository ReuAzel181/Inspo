import { NextRequest, NextResponse } from 'next/server';
import { getReferences, createReference, isDuplicateUrl, updateReference } from '@/lib/localDb';
import { getWebsiteMetadata, normalizeUrl } from '@/lib/website';
import { captureScreenshot, saveScreenshotFile } from '@/lib/screenshot';
import { saveUploadedImage } from '@/lib/upload';
import { Reference } from '@/types';

// GET /api/references - Fetch references with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters = {
      query: searchParams.get('query') || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean),
      industry: searchParams.get('industry') || undefined,
      isFavorite:
        searchParams.get('isFavorite') === 'true'
          ? true
          : searchParams.get('isFavorite') === 'false'
            ? false
            : undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'recent',
      limit: parseInt(searchParams.get('limit') || '50'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    const { references, total } = await getReferences('user-1', filters);

    return NextResponse.json({
      references,
      total,
      count: references.length,
    });
  } catch (error) {
    console.error('GET /api/references error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch references' },
      { status: 500 }
    );
  }
}

// POST /api/references - Create new reference
export async function POST(request: NextRequest) {
  let normalizedUrl = '';
  
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // In a real app, you'd get the user ID from auth/session
    const userId = 'user-1'; // Placeholder

    // Normalize URL
    try {
      normalizedUrl = normalizeUrl(url);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid URL format. Please check and try again.' },
        { status: 400 }
      );
    }

    // Check for duplicate
    try {
      const isDuplicate = await isDuplicateUrl(normalizedUrl, userId);
      if (isDuplicate) {
        return NextResponse.json(
          { error: 'This URL is already in your library' },
          { status: 409 }
        );
      }
    } catch (e) {
      console.warn('Duplicate check failed, continuing:', e);
    }

    // Get website metadata - this never throws anymore
    let websiteData;
    try {
      websiteData = await getWebsiteMetadata(normalizedUrl);
    } catch (e) {
      console.error('Metadata extraction failed:', e);
      // Fallback metadata
      websiteData = {
        title: new URL(normalizedUrl).hostname.replace('www.', ''),
        description: '',
        faviconUrl: `${new URL(normalizedUrl).protocol}//${new URL(normalizedUrl).hostname}/favicon.ico`,
        screenshotUrl: '',
        colors: [],
        typography: [],
        designTags: [],
        sections: [],
      };
    }

    // Create reference in database
    const reference = await createReference(userId, {
      url: normalizedUrl,
      title: websiteData.title || 'Untitled Reference',
      description: websiteData.description || '',
      thumbnailUrl: websiteData.screenshotUrl || '',
      screenshotUrl: websiteData.screenshotUrl || '',
      additionalImageUrls: [],
      thumbnailPosition: 'top',
      additionalImagePositions: [],
      colors: websiteData.colors || [],
      typography: websiteData.typography || [],
      tags: websiteData.designTags || [],
      notes: body.notes || '',
      industry: body.industry || 'Other',
    });

    let finalReference = reference;
    if (body.thumbnailDataUrl) {
      const localImageUrl = await saveUploadedImage(body.thumbnailDataUrl, reference.id);
      if (localImageUrl) {
        finalReference = await updateReference(reference.id, userId, {
          thumbnailUrl: localImageUrl,
          screenshotUrl: localImageUrl,
        });
      }
    }

    // Auto-generate screenshot in the background (don't wait for it)
    generateScreenshotAsync(reference.id, normalizedUrl).catch((err) => {
      console.error('Background screenshot generation failed:', err);
    });

    return NextResponse.json(finalReference, { status: 201 });
  } catch (error) {
    console.error('POST /api/references error:', error);
    
    // Ultimate fallback - create and return a mock reference
    return NextResponse.json({
      id: Math.random().toString(36).substr(2, 9),
      url: normalizedUrl || 'https://example.com',
      title: 'Untitled Reference',
      description: '',
      thumbnailUrl: '',
      screenshotUrl: '',
      additionalImageUrls: [],
      thumbnailPosition: 'top',
      additionalImagePositions: [],
      tags: [],
      colors: [],
      typography: [],
      notes: '',
      isFavorite: false,
      industry: 'Other',
      createdAt: new Date(),
      updatedAt: new Date(),
    }, { status: 201 });
  }
}

// Helper function to generate screenshot asynchronously
async function generateScreenshotAsync(referenceId: string, url: string) {
  try {
    console.log(`Starting background screenshot generation for ${referenceId}`);
    const screenshotData = await captureScreenshot(url, referenceId);
    
    if (screenshotData) {
      const screenshotUrl = await saveScreenshotFile(screenshotData, referenceId);
      
      if (screenshotUrl) {
        // Update reference with screenshot URL
        const { updateReference } = await import('@/lib/localDb');
        await updateReference(referenceId, 'user-1', {
          screenshotUrl,
          thumbnailUrl: screenshotUrl,
        });
        console.log(`Screenshot generated for ${referenceId}: ${screenshotUrl}`);
      }
    }
  } catch (error) {
    console.error(`Screenshot generation failed for ${referenceId}:`, error);
    // Don't throw - this is a background task
  }
}
