import * as fs from 'fs/promises';
import * as path from 'path';

const SCREENSHOTS_DIR = path.join(process.cwd(), 'public', 'screenshots');

// Ensure screenshots directory exists
async function ensureScreenshotsDir() {
  try {
    await fs.mkdir(SCREENSHOTS_DIR, { recursive: true });
  } catch (error) {
    console.warn('Screenshots directory creation attempted');
  }
}

/**
 * Generate a screenshot of a website
 * Returns a data URL that can be stored or served
 */
export async function captureScreenshot(url: string, referenceId: string): Promise<string> {
  await ensureScreenshotsDir();

  try {
    // Try using the screenshot service if configured
    const screenshotApiUrl = process.env.SCREENSHOT_API_URL;
    const screenshotApiKey = process.env.SCREENSHOT_API_KEY;

    if (screenshotApiUrl && screenshotApiKey) {
      return await captureWithExternalService(url, screenshotApiUrl, screenshotApiKey);
    }

    // Fallback: try using a simple API if available
    return await captureWithScreenshotOne(url);
  } catch (error) {
    console.error('Screenshot capture failed:', error);
    return '';
  }
}

/**
 * Capture using external screenshot service (screenshotapi.io or similar)
 */
async function captureWithExternalService(
  url: string,
  apiUrl: string,
  apiKey: string
): Promise<string> {
  try {
    const params = new URLSearchParams({
      url: url,
      token: apiKey,
      width: '1280',
      height: '720',
      format: 'jpg',
    });

    const response = await fetch(`${apiUrl}?${params.toString()}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      timeout: 15000,
    });

    if (response.ok) {
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return `data:image/jpeg;base64,${base64}`;
    }
  } catch (error) {
    console.error('External screenshot service failed:', error);
  }

  return '';
}

/**
 * Capture using screenshotone.com free API
 */
async function captureWithScreenshotOne(url: string): Promise<string> {
  try {
    // Using a free screenshot API (requires no auth)
    const apiUrl = 'https://api.screenshotone.com/take';
    const params = new URLSearchParams({
      access_key: 'free',
      url: url,
      format: 'jpg',
      viewport_width: '1280',
      viewport_height: '720',
      device_scale_factor: '1',
    });

    const response = await fetch(`${apiUrl}?${params.toString()}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      timeout: 15000,
    });

    if (response.ok) {
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      return `data:image/jpeg;base64,${base64}`;
    }
  } catch (error) {
    console.error('ScreenshotOne API failed:', error);
  }

  return '';
}

/**
 * Save screenshot data URL to file
 */
export async function saveScreenshotFile(screenshotData: string, referenceId: string): Promise<string> {
  if (!screenshotData) {
    return '';
  }

  try {
    await ensureScreenshotsDir();

    // Extract base64 data
    const base64Match = screenshotData.match(/base64,(.+)$/);
    if (!base64Match) {
      return '';
    }

    const buffer = Buffer.from(base64Match[1], 'base64');
    const filename = `${referenceId}.jpg`;
    const filepath = path.join(SCREENSHOTS_DIR, filename);

    await fs.writeFile(filepath, buffer);

    // Return public URL
    return `/screenshots/${filename}`;
  } catch (error) {
    console.error('Failed to save screenshot file:', error);
    return '';
  }
}

/**
 * Delete screenshot file
 */
export async function deleteScreenshotFile(referenceId: string): Promise<void> {
  try {
    const filepath = path.join(SCREENSHOTS_DIR, `${referenceId}.jpg`);
    await fs.unlink(filepath);
  } catch (error) {
    console.warn('Failed to delete screenshot file:', error);
  }
}
