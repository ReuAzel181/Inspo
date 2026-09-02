'use client';

import { FilterOptions, DESIGN_TAGS, INDUSTRY_CATEGORIES } from '@/types';

interface FilterPanelProps {
  filters: FilterOptions;
  onChange: (filters: FilterOptions) => void;
}

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-white via-slate-50 to-blue-50/30 rounded-2xl border border-blue-100/40 shadow-sm backdrop-filter backdrop-blur-sm">
      <div>
        <h3 className="text-xs font-bold text-slate-600 mb-4 uppercase tracking-widest flex items-center gap-2">
          <span>🏷️</span> Design Tags
        </h3>
        <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
          {DESIGN_TAGS.map((tag) => (
            <label
              key={tag}
              className="flex items-center gap-3 cursor-pointer group p-2.5 rounded-lg hover:bg-blue-50 transition-all duration-200"
            >
              <input
                type="checkbox"
                checked={filters.tags?.includes(tag) || false}
                onChange={(e) => {
                  const newTags = e.target.checked
                    ? [...(filters.tags || []), tag]
                    : filters.tags?.filter((t) => t !== tag) || [];
                  onChange({ ...filters, tags: newTags });
                }}
                className="w-4 h-4 rounded accent-blue-500 cursor-pointer border border-slate-300 transition-all duration-200"
              />
              <span className="text-sm text-slate-700 group-hover:text-blue-600 font-medium">{tag}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-blue-200/50 to-transparent" />

      <div>
        <h3 className="text-xs font-bold text-slate-600 mb-4 uppercase tracking-widest flex items-center gap-2">
          <span>🏢</span> Industry
        </h3>
        <select
          value={filters.industry || ''}
          onChange={(e) =>
            onChange({ ...filters, industry: e.target.value || undefined })
          }
          className="w-full px-4 py-2.5 border border-blue-200/50 rounded-lg text-sm bg-white/70 hover:bg-white focus:bg-white font-medium text-slate-700"
        >
          <option value="">All Industries</option>
          {INDUSTRY_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-blue-200/50 to-transparent" />

      <div>
        <h3 className="text-xs font-bold text-slate-600 mb-4 uppercase tracking-widest flex items-center gap-2">
          <span>↕️</span> Sort By
        </h3>
        <select
          value={filters.sortBy || 'recent'}
          onChange={(e) =>
            onChange({
              ...filters,
              sortBy: (e.target.value as any) || 'recent',
            })
          }
          className="w-full px-4 py-2.5 border border-blue-200/50 rounded-lg text-sm bg-white/70 hover:bg-white focus:bg-white font-medium text-slate-700"
        >
          <option value="recent">📅 Recently Added</option>
          <option value="oldest">📆 Oldest First</option>
          <option value="title">🔤 Alphabetical</option>
        </select>
      </div>
    </div>
  );
}
