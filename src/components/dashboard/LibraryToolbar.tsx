import type { Dispatch, SetStateAction } from 'react';
import type { SearchParams } from '@/types';
import { SmallChevron } from './icons';

type LibraryView = 'all' | 'favorites' | 'recent';

export function LibraryToolbar({
  libraryView,
  searchParams,
  hasActiveFilters,
  setSearchParams,
  showAllReferences,
  showFavorites,
  showRecentlyAdded,
  clearFilters,
}: {
  libraryView: LibraryView;
  searchParams: SearchParams;
  hasActiveFilters: boolean;
  setSearchParams: Dispatch<SetStateAction<SearchParams>>;
  showAllReferences: () => void;
  showFavorites: () => void;
  showRecentlyAdded: () => void;
  clearFilters: () => void;
}) {
  return (
    <section className="mb-5 flex flex-col gap-3 border-y border-[#e4e7eb] py-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-1 overflow-x-auto">
        <FilterPill label="All" active={libraryView === 'all'} onClick={showAllReferences} />
        <FilterPill label="Favorites" active={libraryView === 'favorites'} onClick={showFavorites} />
        <FilterPill label="Recently added" active={libraryView === 'recent'} onClick={showRecentlyAdded} />
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            value={searchParams.sortBy || 'recent'}
            onChange={(event) => {
              setSearchParams((current) => ({
                ...current,
                sortBy: event.target.value as SearchParams['sortBy'],
              }));
            }}
            className="h-8 appearance-none rounded-md border border-[#dfe3e8] bg-white pl-3 pr-7 text-[11px] font-medium text-[#555c65] outline-none focus:border-[#1769d1]"
            aria-label="Sort references"
          >
            <option value="recent">Recently added</option>
            <option value="oldest">Oldest first</option>
            <option value="title">Alphabetical</option>
          </select>

          <SmallChevron />
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="h-8 rounded-md px-2.5 text-[11px] font-medium text-[#1769d1] hover:bg-[#eff6ff]"
          >
            Clear
          </button>
        )}

      </div>
    </section>
  );
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors ${
        active ? 'bg-[#1769d1] text-white' : 'text-[#737a83] hover:bg-[#f2f4f6] hover:text-[#34393f]'
      }`}
    >
      {label}
    </button>
  );
}
