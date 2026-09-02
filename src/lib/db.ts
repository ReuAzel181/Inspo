import { sql } from '@vercel/postgres';
import { Reference, ReferenceCreateInput, ReferenceUpdateInput, SearchParams } from '@/types';

// Initialize database schema
export async function initializeDatabase() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS references (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        url TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        thumbnail_url TEXT,
        screenshot_url TEXT,
        tags TEXT[] DEFAULT ARRAY[]::TEXT[],
        colors TEXT[] DEFAULT ARRAY[]::TEXT[],
        typography TEXT[] DEFAULT ARRAY[]::TEXT[],
        notes TEXT,
        is_favorite BOOLEAN DEFAULT FALSE,
        industry TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, url)
      );

      CREATE INDEX IF NOT EXISTS idx_references_user_id ON references(user_id);
      CREATE INDEX IF NOT EXISTS idx_references_created_at ON references(created_at);
      CREATE INDEX IF NOT EXISTS idx_references_tags ON references USING GIN(tags);
      CREATE INDEX IF NOT EXISTS idx_references_industry ON references(industry);
    `;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Create reference
export async function createReference(
  userId: string,
  data: ReferenceCreateInput & {
    title: string;
    thumbnailUrl: string;
    screenshotUrl: string;
    description: string;
    colors: string[];
    typography: string[];
  }
): Promise<Reference> {
  try {
    try {
      const result = await sql`
        INSERT INTO references (
          user_id,
          url,
          title,
          description,
          thumbnail_url,
          screenshot_url,
          tags,
          colors,
          typography,
          notes,
          industry
        )
        VALUES (
          ${userId},
          ${data.url},
          ${data.title},
          ${data.description},
          ${data.thumbnailUrl},
          ${data.screenshotUrl},
          ${JSON.stringify(data.tags || [])},
          ${JSON.stringify(data.colors)},
          ${JSON.stringify(data.typography)},
          ${data.notes || ''},
          ${data.industry || 'Other'}
        )
        RETURNING *;
      `;
      return mapDatabaseToReference(result.rows[0]);
    } catch (dbError: any) {
      // If database connection fails, return a mock reference
      if (dbError?.code === 'missing_connection_string') {
        console.warn('Database not configured. Using mock reference.');
        return {
          id: crypto.randomUUID?.() || Math.random().toString(36).substr(2, 9),
          url: data.url,
          title: data.title,
          description: data.description,
          thumbnailUrl: data.thumbnailUrl,
          screenshotUrl: data.screenshotUrl,
          tags: data.tags || [],
          colors: data.colors || [],
          typography: data.typography || [],
          notes: data.notes || '',
          isFavorite: false,
          industry: data.industry || 'Other',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
      throw dbError;
    }

    return mapDatabaseToReference(result.rows[0]);
  } catch (error) {
    console.error('Create reference error:', error);
    throw error;
  }
}

// Get reference by ID
export async function getReferenceById(id: string, userId: string): Promise<Reference | null> {
  try {
    const result = await sql`
      SELECT * FROM references WHERE id = ${id} AND user_id = ${userId};
    `;

    return result.rows.length > 0 ? mapDatabaseToReference(result.rows[0]) : null;
  } catch (error) {
    console.error('Get reference error:', error);
    throw error;
  }
}

// Get all references with filters
export async function getReferences(
  userId: string,
  params: SearchParams
): Promise<{ references: Reference[]; total: number }> {
  try {
    // For simplicity, fetch all user references and filter in-memory
    // For production, build a proper query builder
    let references: Reference[] = [];
    
    try {
      const result = await sql`
        SELECT * FROM references 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 1000;
      `;
      references = result.rows.map(mapDatabaseToReference);
    } catch (dbError: any) {
      // If database connection fails, return empty array
      if (dbError?.code === 'missing_connection_string') {
        console.warn('Database not configured. Returning empty references.');
        return { references: [], total: 0 };
      }
      throw dbError;
    }

    // In-memory filtering
    if (params.query) {
      const q = params.query.toLowerCase();
      references = references.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.url.toLowerCase().includes(q) ||
          r.notes.toLowerCase().includes(q)
      );
    }

    if (params.tags && params.tags.length > 0) {
      references = references.filter((r) =>
        params.tags!.some((tag) => r.tags.includes(tag))
      );
    }

    if (params.industry) {
      references = references.filter((r) => r.industry === params.industry);
    }

    if (params.isFavorite !== undefined) {
      references = references.filter((r) => r.isFavorite === params.isFavorite);
    }

    // Sorting
    if (params.sortBy === 'oldest') {
      references.reverse();
    } else if (params.sortBy === 'title') {
      references.sort((a, b) => a.title.localeCompare(b.title));
    }

    // Pagination
    const offset = params.offset || 0;
    const limit = params.limit || 50;
    const paginatedReferences = references.slice(offset, offset + limit);

    return {
      references: paginatedReferences,
      total: references.length,
    };
  } catch (error) {
    console.error('Get references error:', error);
    throw error;
  }
}

// Update reference
export async function updateReference(
  id: string,
  userId: string,
  data: ReferenceUpdateInput
): Promise<Reference> {
  try {
    // Get current reference
    const current = await getReferenceById(id, userId);
    if (!current) {
      throw new Error('Reference not found');
    }

    // Prepare update values
    const title = data.title !== undefined ? data.title : current.title;
    const tags =
      data.tags !== undefined ? JSON.stringify(data.tags) : JSON.stringify(current.tags);
    const notes = data.notes !== undefined ? data.notes : current.notes;
    const industry = data.industry !== undefined ? data.industry : current.industry;
    const isFavorite = data.isFavorite !== undefined ? data.isFavorite : current.isFavorite;

    const result = await sql`
      UPDATE references 
      SET 
        title = ${title},
        tags = ${tags},
        notes = ${notes},
        industry = ${industry},
        is_favorite = ${isFavorite},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *;
    `;

    if (result.rows.length === 0) {
      throw new Error('Reference not found');
    }

    return mapDatabaseToReference(result.rows[0]);
  } catch (error) {
    console.error('Update reference error:', error);
    throw error;
  }
}

// Delete reference
export async function deleteReference(id: string, userId: string): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM references WHERE id = ${id} AND user_id = ${userId};
    `;

    return result.rowCount > 0;
  } catch (error) {
    console.error('Delete reference error:', error);
    throw error;
  }
}

// Check for duplicate URL
export async function isDuplicateUrl(url: string, userId: string): Promise<boolean> {
  try {
    const result = await sql`
      SELECT id FROM references WHERE url = ${url} AND user_id = ${userId};
    `;

    return result.rows.length > 0;
  } catch (error) {
    console.error('Duplicate check error:', error);
    throw error;
  }
}

// Helper function to map database row to Reference type
function mapDatabaseToReference(row: any): Reference {
  return {
    id: row.id,
    userId: row.user_id,
    url: row.url,
    title: row.title,
    description: row.description,
    thumbnailUrl: row.thumbnail_url,
    screenshotUrl: row.screenshot_url,
    tags: row.tags || [],
    colors: row.colors || [],
    typography: row.typography || [],
    notes: row.notes || '',
    isFavorite: row.is_favorite,
    industry: row.industry,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}
