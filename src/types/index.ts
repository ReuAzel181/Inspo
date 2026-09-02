// Database Schema Types
export interface Reference {
  id: string;
  userId: string;
  url: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  screenshotUrl: string;
  tags: string[];
  colors: string[];
  typography: string[];
  notes: string;
  isFavorite: boolean;
  industry: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReferenceCreateInput {
  url: string;
  title?: string;
  tags?: string[];
  notes?: string;
  industry?: string;
}

export interface ReferenceUpdateInput {
  title?: string;
  tags?: string[];
  notes?: string;
  industry?: string;
  isFavorite?: boolean;
}

// Extracted Data Types
export interface ExtractedWebsiteData {
  title: string;
  description: string;
  faviconUrl: string;
  screenshotUrl: string;
  colors: string[];
  typography: string[];
  designTags: string[];
  sections: WebsiteSection[];
}

export interface WebsiteSection {
  type: 'hero' | 'about' | 'services' | 'testimonials' | 'cta' | 'footer' | 'other';
  preview?: string;
}

// Filter and Search Types
export interface FilterOptions {
  tags?: string[];
  industry?: string;
  isFavorite?: boolean;
  sortBy?: 'recent' | 'oldest' | 'title' | 'added';
}

export interface SearchParams extends FilterOptions {
  query?: string;
  limit?: number;
  offset?: number;
}

// Design Tag Constants
export const DESIGN_TAGS = [
  'Elegant',
  'Minimal',
  'Editorial',
  'Luxury',
  'Bold',
  'Playful',
  'Corporate',
  'Modern',
  'Brutalist',
  'Rounded',
  'Sharp',
  'Dark',
  'Light',
  'Experimental',
  'Typography-focused',
] as const;

export type DesignTag = (typeof DESIGN_TAGS)[number];

export const INDUSTRY_CATEGORIES = [
  'Technology',
  'Fashion',
  'Healthcare',
  'Finance',
  'Real Estate',
  'Hospitality',
  'Food & Beverage',
  'Creative Services',
  'E-Commerce',
  'Media & Publishing',
  'Education',
  'Non-Profit',
  'Other',
] as const;

export type IndustryCategory = (typeof INDUSTRY_CATEGORIES)[number];
