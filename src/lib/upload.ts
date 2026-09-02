import * as fs from 'fs/promises';
import * as path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads');

export async function saveUploadedImage(dataUrl: string, referenceId: string): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) {
    return '';
  }

  const matches = dataUrl.match(/^data:image\/(.+?);base64,(.*)$/);
  if (!matches) {
    return '';
  }

  const imageType = matches[1] || 'png';
  const base64Data = matches[2];
  const fileName = `reference-${referenceId}.${imageType}`;

  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(
    path.join(UPLOADS_DIR, fileName),
    Buffer.from(base64Data, 'base64')
  );

  return `/uploads/${fileName}`;
}
