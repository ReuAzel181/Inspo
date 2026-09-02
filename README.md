# Inspo

A visual website reference library for web designers. Paste a website URL and automatically capture screenshots, extract design characteristics, and organize references with powerful filtering and search.

## Features

- **Instant Reference Capture**: Paste a URL and get automatic screenshots, metadata, and design tag classification
- **Visual Grid & List Views**: Switch between a dense visual grid and archive-style list for different workflows
- **Smart Filtering**: Filter by design tags (Elegant, Minimal, Editorial, etc.), industry categories, favorites, and more
- **Powerful Search**: Search by website name, tags, URLs, and notes
- **Design Details**: View extracted colors, typography, and design characteristics
- **Editable Metadata**: Manually correct or refine auto-generated tags and notes
- **Favorites System**: Mark important references for quick access
- **Collections**: Organized access to All References, Favorites, Recently Added

## Tech Stack

- **Frontend**: Next.js 15 with React 19 and TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Database**: Vercel Postgres (or Neon PostgreSQL)
- **Storage**: Vercel Blob for screenshots and assets
- **Deployment**: Vercel (serverless-friendly)

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Vercel account (for deployment)
- PostgreSQL database (Vercel Postgres or Neon)
- Screenshot API key (screenshotapi.io or similar)

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Copy `.env.local.example` to `.env.local` and fill in:
   ```bash
   cp .env.local.example .env.local
   ```

   Required environment variables:
   - `POSTGRES_URL`: PostgreSQL connection string
   - `BLOB_READ_WRITE_TOKEN`: Vercel Blob token (optional, for production)
   - `SCREENSHOT_API_URL`: Screenshot service endpoint
   - `SCREENSHOT_API_KEY`: Screenshot service API key
   - `OPENAI_API_KEY`: For AI-powered classification (optional)
   - `NEXT_PUBLIC_APP_URL`: Public app URL

3. **Initialize database**:
   ```bash
   npm run build
   # The database will initialize automatically on first run
   ```

4. **Run development server**:
   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000`

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── references/          # API routes for CRUD operations
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Main dashboard
│   └── globals.css              # Global styles
├── components/
│   ├── Navigation.tsx           # Top navigation
│   ├── URLInput.tsx             # URL input form
│   ├── ReferenceCard.tsx        # Individual reference card
│   ├── ReferenceGrid.tsx        # Grid/list container
│   ├── ReferenceModal.tsx       # Detail view modal
│   └── FilterPanel.tsx          # Filter controls
├── lib/
│   ├── db.ts                    # Database operations
│   └── website.ts               # Website metadata extraction
└── types/
    └── index.ts                 # TypeScript type definitions
```

## Database Schema

### `references` table

```sql
CREATE TABLE references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  screenshot_url TEXT,
  tags TEXT[] DEFAULT ARRAY[],
  colors TEXT[] DEFAULT ARRAY[],
  typography TEXT[] DEFAULT ARRAY[],
  notes TEXT,
  is_favorite BOOLEAN DEFAULT FALSE,
  industry TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, url)
);
```

## API Endpoints

### GET `/api/references`
Fetch references with optional filters.

**Query Parameters**:
- `query`: Search term (name, tags, URL, notes)
- `tags`: Comma-separated design tags
- `industry`: Industry category filter
- `isFavorite`: Boolean filter for favorites
- `sortBy`: `recent`, `oldest`, or `title`
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

**Response**:
```json
{
  "references": [...],
  "total": 42,
  "count": 50
}
```

### POST `/api/references`
Create a new reference from a URL.

**Body**:
```json
{
  "url": "https://example.com",
  "notes": "Optional notes",
  "industry": "Technology"
}
```

**Response**: Reference object with extracted metadata

### PATCH `/api/references/[id]`
Update a reference's metadata.

**Body**:
```json
{
  "title": "Updated Title",
  "tags": ["Minimal", "Modern"],
  "notes": "Updated notes",
  "industry": "Technology",
  "isFavorite": true
}
```

### DELETE `/api/references/[id]`
Delete a reference.

## Deployment to Vercel

1. **Push to Git repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**:
   ```bash
   npm install -g vercel
   vercel
   ```

3. **Set environment variables** in Vercel dashboard:
   - `POSTGRES_URL`
   - `BLOB_READ_WRITE_TOKEN`
   - `SCREENSHOT_API_URL`
   - `SCREENSHOT_API_KEY`
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_APP_URL`

4. **Deploy**:
   ```bash
   vercel --prod
   ```

## Configuration

### Screenshot Service

Inspo uses an external screenshot API (e.g., screenshotapi.io). Configure in `.env.local`:

```
SCREENSHOT_API_URL=https://api.screenshotapi.io/v1/screenshot
SCREENSHOT_API_KEY=your_api_key_here
```

Alternative services:
- [screenshotapi.io](https://www.screenshotapi.io/) - Free tier available
- [urlshotapi.com](https://urlshotapi.com/)
- [ApiFlash](https://apiflash.com/)

### Database Setup

For Vercel Postgres:
```bash
vercel postgres create
```

For Neon:
1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string to `POSTGRES_URL`

## Design Tags Reference

Inspo includes 15 built-in design classification tags:

- **Elegant** - Sophisticated, refined aesthetic
- **Minimal** - Clean, uncluttered design
- **Editorial** - Magazine or publication-style
- **Luxury** - Premium, high-end appearance
- **Bold** - Strong, impactful visual presence
- **Playful** - Fun, lighthearted tone
- **Corporate** - Professional, business-focused
- **Modern** - Contemporary design approach
- **Brutalist** - Raw, utilitarian design
- **Rounded** - Curves and soft corners
- **Sharp** - Angular, geometric design
- **Dark** - Dark color scheme
- **Light** - Light color scheme
- **Experimental** - Innovative, unconventional
- **Typography-focused** - Strong emphasis on type

## Industry Categories

Inspo supports 13 industry categories:

Technology, Fashion, Healthcare, Finance, Real Estate, Hospitality, Food & Beverage, Creative Services, E-Commerce, Media & Publishing, Education, Non-Profit, Other

## Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler
```

### Adding a Design Tag

Edit `src/types/index.ts` and add to `DESIGN_TAGS` constant:

```typescript
export const DESIGN_TAGS = [
  'Elegant',
  'Minimal',
  // ... add new tag here
] as const;
```

### Adding an Industry Category

Edit `src/types/index.ts` and add to `INDUSTRY_CATEGORIES` constant.

## Performance Optimization

- **Image Optimization**: Lazy loading for reference thumbnails
- **Database Indexing**: Indexes on frequently queried columns
- **API Pagination**: Limit default results to 50 items
- **Search Optimization**: Text search uses indexed columns
- **Caching**: Consider implementing Redis for filtered results

## Security Considerations

- **User Authentication**: Currently uses placeholder `user-1`. Implement real authentication.
- **Environment Variables**: Never commit `.env.local` to version control
- **URL Validation**: Validates and normalizes URLs before processing
- **SQL Injection**: Uses parameterized queries
- **Rate Limiting**: Consider adding rate limiting to API endpoints

## Future Enhancements

- [ ] User authentication and multi-user support
- [ ] Collections/folders for organizing references
- [ ] Comparison view for side-by-side reference analysis
- [ ] Export references as PDF/CSV
- [ ] Collaboration features (sharing collections)
- [ ] Mobile app (React Native)
- [ ] Browser extension for quick capture
- [ ] Advanced color palette extraction
- [ ] Similar references recommendation engine
- [ ] Custom tagging system
- [ ] AI-powered design analysis with Claude/GPT

## Troubleshooting

### "Invalid URL" error
- Ensure URL is valid and accessible
- Try adding `https://` prefix manually
- Check if website blocks automated screenshot requests

### Database connection error
- Verify `POSTGRES_URL` is correct
- Ensure PostgreSQL server is running
- Check network connectivity

### Screenshots not loading
- Verify screenshot API credentials
- Check API rate limits
- Confirm API service is operational

### Styling issues
- Clear `.next` cache: `rm -rf .next`
- Rebuild Tailwind: `npm run build`
- Verify PostCSS configuration

## License

MIT

## Support

For issues or questions, please open an issue on GitHub or check the documentation.

---

**Inspo** - Curating the visual web, one reference at a time.
