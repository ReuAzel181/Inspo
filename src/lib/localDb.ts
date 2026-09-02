import * as fs from 'fs/promises';
import * as path from 'path';
import { Reference, ReferenceCreateInput, SearchParams } from '@/types';

// Use a local data directory
const DATA_DIR = path.join(process.cwd(), '.data');
const REFERENCES_FILE = path.join(DATA_DIR, 'references.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (error) {
    console.warn('Data directory already exists or could not be created');
  }
}

// Read all references from local file
async function readReferences(): Promise<Reference[]> {
  await ensureDataDir();
  try {
    const data = await fs.readFile(REFERENCES_FILE, 'utf-8');
    const references = JSON.parse(data) || [];
    return references.map((reference: Partial<Reference>) => ({
      ...reference,
      userId: reference.userId || 'user-1',
      additionalImageUrls: reference.additionalImageUrls || [],
      thumbnailPosition: reference.thumbnailPosition || 'top',
      additionalImagePositions: reference.additionalImagePositions || [],
    })) as Reference[];
  } catch (error) {
    // File doesn't exist yet, return empty array
    return [];
  }
}

// Write references to local file
async function writeReferences(references: Reference[]) {
  await ensureDataDir();
  await fs.writeFile(REFERENCES_FILE, JSON.stringify(references, null, 2), 'utf-8');
}

// Generate UUID locally
function generateId(): string {
  return 'ref-' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// Create reference
export async function createReference(
  userId: string,
  data: ReferenceCreateInput & {
    title: string;
    thumbnailUrl: string;
    screenshotUrl: string;
    additionalImageUrls?: string[];
    thumbnailPosition?: 'top' | 'center' | 'bottom';
    additionalImagePositions?: ('top' | 'center' | 'bottom')[];
    description: string;
    colors: string[];
    typography: string[];
  }
): Promise<Reference> {
  const references = await readReferences();

  // Check for duplicate URL
  const duplicate = references.find((ref) => ref.url === data.url && ref.id.startsWith('ref-'));
  if (duplicate) {
    throw new Error('Duplicate URL already exists');
  }

  const now = new Date();
  const reference: Reference = {
    id: generateId(),
    userId,
    url: data.url,
    title: data.title,
    description: data.description,
    thumbnailUrl: data.thumbnailUrl,
    screenshotUrl: data.screenshotUrl,
    additionalImageUrls: data.additionalImageUrls || [],
    thumbnailPosition: data.thumbnailPosition || 'top',
    additionalImagePositions: data.additionalImagePositions || [],
    tags: data.tags || [],
    colors: data.colors || [],
    typography: data.typography || [],
    notes: data.notes || '',
    isFavorite: false,
    industry: data.industry || 'Other',
    createdAt: now,
    updatedAt: now,
  };

  references.push(reference);
  await writeReferences(references);
  return reference;
}

// Get reference by ID
export async function getReferenceById(id: string): Promise<Reference | null> {
  const references = await readReferences();
  return references.find((ref) => ref.id === id) || null;
}

// Get all references with filters
export async function getReferences(
  userId: string,
  params: SearchParams
): Promise<{ references: Reference[]; total: number }> {
  let references = await readReferences();

  // Apply filters
  if (params.query) {
    const q = params.query.toLowerCase();
    references = references.filter(
      (ref) =>
        ref.title.toLowerCase().includes(q) ||
        ref.description.toLowerCase().includes(q) ||
        ref.url.toLowerCase().includes(q)
    );
  }

  if (params.tags && params.tags.length > 0) {
    references = references.filter((ref) =>
      params.tags!.some((tag) => ref.tags.includes(tag))
    );
  }

  if (params.industry) {
    references = references.filter((ref) => ref.industry === params.industry);
  }

  if (params.isFavorite !== undefined) {
    references = references.filter((ref) => ref.isFavorite === params.isFavorite);
  }

  // Sort
  if (params.sortBy === 'oldest') {
    references.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else {
    // Default: recent
    references.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Paginate
  const offset = params.offset || 0;
  const limit = params.limit || 50;
  const total = references.length;
  references = references.slice(offset, offset + limit);

  return { references, total };
}

// Update reference
export async function updateReference(
  id: string,
  userId: string,
  updates: Partial<Reference>
): Promise<Reference> {
  const references = await readReferences();
  const index = references.findIndex((ref) => ref.id === id);

  if (index === -1) {
    throw new Error('Reference not found');
  }

  const updated = {
    ...references[index],
    ...updates,
    updatedAt: new Date(),
  };

  references[index] = updated;
  await writeReferences(references);
  return updated;
}

// Delete reference
export async function deleteReference(id: string, userId: string): Promise<boolean> {
  const references = await readReferences();
  const index = references.findIndex((ref) => ref.id === id);

  if (index === -1) {
    return false;
  }

  references.splice(index, 1);
  await writeReferences(references);
  return true;
}

// Check for duplicate URL
export async function isDuplicateUrl(url: string, userId: string): Promise<boolean> {
  const references = await readReferences();
  return references.some((ref) => ref.url === url);
}
