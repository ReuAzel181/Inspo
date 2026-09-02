import { ExtractedWebsiteData, DESIGN_TAGS } from '@/types';

/**
 * Validate and normalize URL
 */
export function normalizeUrl(url: string): string {
  let normalized = url.trim();

  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }

  try {
    return new URL(normalized).toString();
  } catch {
    throw new Error('Invalid URL');
  }
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

/**
 * Get website metadata and screenshot
 */
export async function getWebsiteMetadata(url: string): Promise<ExtractedWebsiteData> {
  const normalizedUrl = normalizeUrl(url);
  let html = '';

  try {
    // Fetch the page to extract metadata
    const response = await fetch(normalizedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://www.google.com/',
      },
      signal: AbortSignal.timeout(10000),
      redirect: 'follow',
    });

    if (!response.ok) {
      console.warn(`Website returned status ${response.statusText}. Using minimal metadata.`);
    } else {
      html = await response.text();
    }
  } catch (error) {
    console.warn('Failed to fetch website content:', error);
    // Continue with empty HTML - we'll use fallbacks
  }

  try {
    // Extract metadata with fallbacks
    const title = (html ? extractMetaTag(html, 'og:title') || extractTitleTag(html) : null) || extractDomain(url);
    const description = (html ? extractMetaTag(html, 'og:description') || extractMetaTag(html, 'description') : null) || '';
    const faviconUrl = extractFaviconUrl(url);

    // Get screenshot URL (optional, gracefully fail)
    let screenshotUrl = '';
    try {
      screenshotUrl = await getScreenshotUrl(normalizedUrl);
    } catch (e) {
      console.warn('Screenshot generation failed:', e);
    }

    // Extract colors and typography from HTML analysis (safe with empty HTML)
    const colors = html ? analyzeColors(html) : [];
    const typography = html ? analyzeTypography(html) : [];
    const designTags = html ? classifyDesignTags(html, colors, typography) : [];
    const sections = html ? analyzePageSections(html) : [];

    return {
      title,
      description,
      faviconUrl,
      screenshotUrl,
      colors,
      typography,
      designTags,
      sections,
    };
  } catch (error) {
    console.error('Error extracting metadata:', error);
    // Last resort: return minimal valid data
    return {
      title: extractDomain(url),
      description: '',
      faviconUrl: extractFaviconUrl(url),
      screenshotUrl: '',
      colors: [],
      typography: [],
      designTags: [],
      sections: [],
    };
  }
}

/**
 * Extract meta tag value from HTML
 */
function extractMetaTag(html: string, property: string): string | null {
  const regex = new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)['"']`, 'i');
  const match = html.match(regex);
  return match ? match[1] : null;
}

/**
 * Extract title from HTML
 */
function extractTitleTag(html: string): string | null {
  const regex = /<title[^>]*>([^<]+)<\/title>/i;
  const match = html.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Extract favicon URL
 */
function extractFaviconUrl(baseUrl: string): string {
  const url = new URL(baseUrl);
  return `${url.protocol}//${url.hostname}/favicon.ico`;
}

/**
 * Get screenshot URL from screenshot service
 */
async function getScreenshotUrl(url: string): Promise<string> {
  const screenshotApiUrl = process.env.SCREENSHOT_API_URL;
  const screenshotApiKey = process.env.SCREENSHOT_API_KEY;

  if (!screenshotApiUrl || !screenshotApiKey) {
    // Fallback: use a placeholder or return empty string
    return '';
  }

  try {
    // Using screenshotapi.io or similar service
    const params = new URLSearchParams({
      url: url,
      token: screenshotApiKey,
      width: '1280',
      height: '720',
      format: 'jpg',
    });

    return `${screenshotApiUrl}?${params.toString()}`;
  } catch (error) {
    console.error('Screenshot URL generation error:', error);
    return '';
  }
}

/**
 * Analyze dominant colors from HTML/CSS
 */
function analyzeColors(html: string): string[] {
  const colors: string[] = [];
  const colorRegex = /#(?:[0-9a-f]{3}){1,2}|rgb\([^)]*\)/gi;
  const matches = html.match(colorRegex);

  if (matches) {
    const uniqueColors = [...new Set(matches.slice(0, 5))];
    colors.push(...uniqueColors);
  }

  return colors.slice(0, 5);
}

/**
 * Analyze typography from HTML
 */
function analyzeTypography(html: string): string[] {
  const typography: string[] = [];
  const fontRegex = /font-family:\s*([^;,\n]+)/gi;
  const matches = html.match(fontRegex);

  if (matches) {
    matches.forEach((match) => {
      const font = match.replace('font-family:', '').trim().replace(/['"]/g, '').split(',')[0].trim();
      if (font && !typography.includes(font)) {
        typography.push(font);
      }
    });
  }

  return typography.slice(0, 3);
}

/**
 * Analyze page sections
 */
function analyzePageSections(html: string) {
  const sections = [];

  if (/hero|banner|jumbotron|headline/i.test(html)) {
    sections.push({ type: 'hero' as const });
  }
  if (/about|team|company/i.test(html)) {
    sections.push({ type: 'about' as const });
  }
  if (/service|product|solution/i.test(html)) {
    sections.push({ type: 'services' as const });
  }
  if (/testimonial|review|client/i.test(html)) {
    sections.push({ type: 'testimonials' as const });
  }
  if (/call.?to.?action|cta|contact|signup/i.test(html)) {
    sections.push({ type: 'cta' as const });
  }
  if (/<footer/i.test(html)) {
    sections.push({ type: 'footer' as const });
  }

  return sections;
}

/**
 * Classify design tags using simple heuristics
 */
function classifyDesignTags(html: string, colors: string[], typography: string[]): string[] {
  const tags: typeof DESIGN_TAGS = [...DESIGN_TAGS];
  const classified: string[] = [];

  // Heuristics for design classification
  const htmlLower = html.toLowerCase();

  // Dark vs Light
  const isDark = colors.some((c) => isColorDark(c));
  if (isDark) {
    classified.push('Dark');
  } else {
    classified.push('Light');
  }

  // Minimal vs Bold
  if (htmlLower.includes('minimalist') || htmlLower.includes('minimal')) {
    classified.push('Minimal');
  } else if (/bold|heavy|strong/i.test(htmlLower)) {
    classified.push('Bold');
  }

  // Modern vs Experimental
  if (/modern|contemporary|latest/i.test(htmlLower)) {
    classified.push('Modern');
  } else if (/experimental|innovative|cutting.?edge/i.test(htmlLower)) {
    classified.push('Experimental');
  }

  // Rounded vs Sharp
  const hasRoundedCorners = /border-radius:\s*\d+px/i.test(html);
  if (hasRoundedCorners) {
    classified.push('Rounded');
  } else {
    classified.push('Sharp');
  }

  // Typography-focused
  if (typography.length > 2 || /typography|font|typeface/i.test(htmlLower)) {
    classified.push('Typography-focused');
  }

  return classified.filter((tag) => tags.includes(tag as any)).slice(0, 5);
}

/**
 * Check if a hex color is dark
 */
function isColorDark(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}
