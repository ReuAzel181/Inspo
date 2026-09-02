'use client';

import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { ReferenceGrid } from '@/components/ReferenceGrid';
import { URLInput } from '@/components/URLInput';
import {
  Reference,
  SearchParams,
  DESIGN_TAGS,
  INDUSTRY_CATEGORIES,
} from '@/types';

type LibraryView = 'all' | 'favorites' | 'recent';

export default function DashboardPage() {
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [libraryView, setLibraryView] = useState<LibraryView>('all');
  const [searchParams, setSearchParams] = useState<SearchParams>({
    sortBy: 'recent',
  });

  useEffect(() => {
    const fetchReferences = async () => {
      try {
        setLoading(true);

        const query = new URLSearchParams();

        if (searchParams.query) query.set('query', searchParams.query);
        if (searchParams.sortBy) query.set('sortBy', searchParams.sortBy);
        if (searchParams.tags?.length) query.set('tags', searchParams.tags.join(','));
        if (searchParams.industry) query.set('industry', searchParams.industry);
        if (searchParams.isFavorite !== undefined) {
          query.set('isFavorite', String(searchParams.isFavorite));
        }

        const response = await fetch('/api/references?' + query.toString());

        if (response.ok) {
          const data = await response.json();
          setReferences(data.references);
        }
      } catch (error) {
        console.error('Failed to fetch references:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferences();
  }, [searchParams]);

  const handleAddReference = (newReference: Reference) => {
    setReferences((current) => [newReference, ...current]);
  };

  const handleUpdateReference = (updatedReference: Reference) => {
    setReferences((current) =>
      current.map((reference) =>
        reference.id === updatedReference.id ? updatedReference : reference
      )
    );
  };

  const handleDeleteReference = (id: string) => {
    setReferences((current) => current.filter((reference) => reference.id !== id));
  };

  const hasActiveFilters = Boolean(
    searchParams.query ||
      searchParams.tags?.length ||
      searchParams.industry ||
      searchParams.isFavorite
  );

  const clearFilters = () => {
    setLibraryView('all');
    setSearchParams({ sortBy: 'recent' });
  };

  const showAllReferences = () => {
    setLibraryView('all');
    setSearchParams({
      ...searchParams,
      sortBy: 'recent',
      isFavorite: undefined,
    });
  };

  const showFavorites = () => {
    setLibraryView('favorites');
    setSearchParams({
      ...searchParams,
      isFavorite: true,
    });
  };

  const showRecentlyAdded = () => {
    setLibraryView('recent');
    setSearchParams({
      ...searchParams,
      sortBy: 'recent',
      isFavorite: undefined,
    });
  };

  const handleTagChange = (tag: string, checked: boolean) => {
    const newTags = checked
      ? [...(searchParams.tags || []), tag]
      : (searchParams.tags || []).filter((currentTag) => currentTag !== tag);

    setSearchParams({
      ...searchParams,
      tags: newTags.length > 0 ? newTags : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] text-[#17191c]">
      <DashboardSidebar
        sidebarOpen={sidebarOpen}
        libraryView={libraryView}
        searchParams={searchParams}
        setSearchParams={setSearchParams}
        showAllReferences={showAllReferences}
        showFavorites={showFavorites}
        showRecentlyAdded={showRecentlyAdded}
        handleTagChange={handleTagChange}
        setSidebarOpen={setSidebarOpen}
      />

      <main className="min-h-screen lg:pl-[248px]">
        <div className="mx-auto max-w-[1600px] px-5 py-5 sm:px-7 lg:px-9">
          <LibraryTopBar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            searchParams={searchParams}
            setSearchParams={setSearchParams}
          />

          <PageHeader referenceCount={references.length} />

          <LibraryToolbar
            libraryView={libraryView}
            searchParams={searchParams}
            hasActiveFilters={hasActiveFilters}
            viewMode={viewMode}
            setViewMode={setViewMode}
            setSearchParams={setSearchParams}
            showAllReferences={showAllReferences}
            showFavorites={showFavorites}
            showRecentlyAdded={showRecentlyAdded}
            clearFilters={clearFilters}
          />

          <AddReferencePanel onAdd={handleAddReference} />

          <LibraryContent
            loading={loading}
            references={references}
            viewMode={viewMode}
            hasActiveFilters={hasActiveFilters}
            onUpdate={handleUpdateReference}
            onDelete={handleDeleteReference}
          />
        </div>
      </main>
    </div>
  );
}

function DashboardSidebar({
  sidebarOpen,
  libraryView,
  searchParams,
  setSearchParams,
  showAllReferences,
  showFavorites,
  showRecentlyAdded,
  handleTagChange,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  libraryView: LibraryView;
  searchParams: SearchParams;
  setSearchParams: Dispatch<SetStateAction<SearchParams>>;
  showAllReferences: () => void;
  showFavorites: () => void;
  showRecentlyAdded: () => void;
  handleTagChange: (tag: string, checked: boolean) => void;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <>
      <aside
        id="inspo-sidebar"
        className={`fixed inset-y-0 left-0 z-40 w-[248px] border-r border-[#e4e7eb] bg-white transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-[72px] items-center border-b border-[#e9ebee] px-6">
            <div>
              <div className="text-[17px] font-semibold tracking-[-0.02em] text-[#16181b]">
                Inspo
              </div>
              <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#8b9199]">
                Design Library
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6">
            <section className="mb-8">
              <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9298a1]">
                Collection
              </div>

              <div className="space-y-1">
                <NavItem label="All sources" icon={<LibraryIcon />} isActive={false} onClick={() => {}} />
                <NavItem label="Pinned" icon={<StarIcon />} isActive={false} onClick={() => {}} />
              </div>
            </section>

            <section className="mb-8">
              <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9298a1]">
                Library
              </div>

              <nav className="space-y-0.5">
                <NavItem label="All references" icon={<LibraryIcon />} isActive={libraryView === 'all'} onClick={showAllReferences} />
                <NavItem label="Favorites" icon={<StarIcon />} isActive={libraryView === 'favorites'} onClick={showFavorites} />
                <NavItem label="Recently added" icon={<ClockIcon />} isActive={libraryView === 'recent'} onClick={showRecentlyAdded} />
              </nav>
            </section>

            <section className="mb-8">
              <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9298a1]">
                Tags
              </div>

              <div className="space-y-0.5">
                {DESIGN_TAGS.map((tag) => {
                  const checked = searchParams.tags?.includes(tag) || false;

                  return (
                    <label
                      key={tag}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors ${
                        checked
                          ? 'bg-[#eff6ff] text-[#1769d1]'
                          : 'text-[#5f6670] hover:bg-[#f5f6f8] hover:text-[#24282d]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          handleTagChange(tag, event.target.checked);
                        }}
                        className="sr-only"
                      />

                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border ${
                          checked
                            ? 'border-[#1769d1] bg-[#1769d1]'
                            : 'border-[#cbd0d6] bg-white'
                        }`}
                      >
                        {checked && <CheckIcon />}
                      </span>

                      <span>{tag}</span>
                    </label>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9298a1]">
                Industry
              </div>

              <div className="relative">
                <select
                  value={searchParams.industry || ''}
                  onChange={(event) => {
                    setSearchParams((current) => ({
                      ...current,
                      industry: event.target.value || undefined,
                    }));
                  }}
                  className="h-9 w-full appearance-none rounded-md border border-[#dfe3e8] bg-white px-3 pr-8 text-[12px] text-[#454b53] outline-none transition-colors hover:border-[#c8cdd4] focus:border-[#1769d1] focus:ring-2 focus:ring-[#1769d1]/10"
                  aria-label="Filter by industry"
                >
                  <option value="">All industries</option>
                  {INDUSTRY_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <ChevronIcon />
              </div>
            </section>
          </div>

          <div className="border-t border-[#e9ebee] px-6 py-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-[#a0a5ac]">Private collection</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#1769d1]" />
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close filters"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
        />
      )}
    </>
  );
}

function LibraryTopBar({
  sidebarOpen,
  setSidebarOpen,
  searchParams,
  setSearchParams,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  searchParams: SearchParams;
  setSearchParams: Dispatch<SetStateAction<SearchParams>>;
}) {
  return (
    <header className="mb-8 flex items-center gap-3">
      <button
        type="button"
        onClick={() => setSidebarOpen((open) => !open)}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#dfe3e8] bg-white text-[#515861] lg:hidden"
        aria-expanded={sidebarOpen}
        aria-controls="inspo-sidebar"
      >
        <MenuIcon />
      </button>

      <div className="flex h-10 flex-1 items-center rounded-md border border-[#dfe3e8] bg-white transition-colors focus-within:border-[#1769d1] focus-within:ring-2 focus-within:ring-[#1769d1]/10">
        <span className="ml-3.5 text-[#8e959e]">
          <SearchIcon />
        </span>

        <input
          type="text"
          placeholder="Search your references"
          value={searchParams.query || ''}
          onChange={(event) => {
            setSearchParams((current) => ({
              ...current,
              query: event.target.value || undefined,
            }));
          }}
          aria-label="Search references"
          className="h-full flex-1 bg-transparent px-3 text-[13px] text-[#202328] outline-none placeholder:text-[#9da3aa]"
        />

        <div className="mr-3 hidden items-center gap-1 sm:flex">
          <kbd className="rounded border border-[#e2e5e9] bg-[#f7f8f9] px-1.5 py-0.5 text-[10px] text-[#8d949c]">⌘</kbd>
          <kbd className="rounded border border-[#e2e5e9] bg-[#f7f8f9] px-1.5 py-0.5 text-[10px] text-[#8d949c]">K</kbd>
        </div>
      </div>

      <div className="hidden h-10 items-center rounded-md border border-[#e2e5e9] bg-white px-3.5 sm:flex">
        <div className="mr-2.5 flex h-6 w-6 items-center justify-center rounded bg-[#1769d1] text-[10px] font-bold text-white">
          R
        </div>

        <span className="text-[11px] font-medium text-[#5f6670]">My Library</span>
      </div>
    </header>
  );
}

function PageHeader({ referenceCount }: { referenceCount: number }) {
  return (
    <section className="mb-7">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1769d1]">
            Your collection
          </p>

          <h1 className="text-[30px] font-semibold leading-[1.15] tracking-[-0.025em] text-[#17191c] sm:text-[34px]">
            References
          </h1>

          <p className="mt-2 max-w-xl text-[13px] leading-5 text-[#777e87]">
            A curated archive of websites, interfaces, and visual ideas.
          </p>
        </div>

        <div className="hidden text-right sm:block">
          <div className="text-[20px] font-semibold leading-none text-[#24282d]">{referenceCount}</div>
          <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#979da5]">
            References
          </div>
        </div>
      </div>
    </section>
  );
}

function LibraryToolbar({
  libraryView,
  searchParams,
  hasActiveFilters,
  viewMode,
  setViewMode,
  setSearchParams,
  showAllReferences,
  showFavorites,
  showRecentlyAdded,
  clearFilters,
}: {
  libraryView: LibraryView;
  searchParams: SearchParams;
  hasActiveFilters: boolean;
  viewMode: 'grid' | 'list';
  setViewMode: Dispatch<SetStateAction<'grid' | 'list'>>;
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

        <div className="flex h-8 rounded-md border border-[#dfe3e8] bg-white p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex w-8 items-center justify-center rounded-[4px] ${
              viewMode === 'grid' ? 'bg-[#edf4fd] text-[#1769d1]' : 'text-[#969ca4]'
            }`}
            aria-label="Grid view"
            aria-pressed={viewMode === 'grid'}
          >
            <GridIcon />
          </button>

          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex w-8 items-center justify-center rounded-[4px] ${
              viewMode === 'list' ? 'bg-[#edf4fd] text-[#1769d1]' : 'text-[#969ca4]'
            }`}
            aria-label="List view"
            aria-pressed={viewMode === 'list'}
          >
            <ListIcon />
          </button>
        </div>
      </div>
    </section>
  );
}

function AddReferencePanel({ onAdd }: { onAdd: (reference: Reference) => void }) {
  return (
    <section className="mb-8">
      <div className="rounded-lg border border-[#1769d1]/20 bg-[#f2f7fd] p-4 sm:p-5">
        <div className="mb-3 flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#1769d1] text-white">
            <PlusIcon />
          </div>

          <div>
            <h2 className="text-[14px] font-semibold leading-5 text-[#1d2938]">
              Add a reference
            </h2>

            <p className="mt-0.5 text-[12px] leading-5 text-[#687587]">
              Paste a website URL to add it to your collection.
            </p>
          </div>
        </div>

        <div className="rounded-md border border-[#d7e1ed] bg-white p-1">
          <URLInput onAdd={onAdd} />
        </div>
      </div>
    </section>
  );
}

function LibraryContent({
  loading,
  references,
  viewMode,
  hasActiveFilters,
  onUpdate,
  onDelete,
}: {
  loading: boolean;
  references: Reference[];
  viewMode: 'grid' | 'list';
  hasActiveFilters: boolean;
  onUpdate: (reference: Reference) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className="pb-12">
      {loading ? (
        <LoadingState />
      ) : references.length === 0 ? (
        <EmptyState hasActiveFilters={hasActiveFilters} />
      ) : (
        <ReferenceGrid
          references={references}
          viewMode={viewMode}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
    </section>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
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

function NavItem({
  label,
  icon,
  isActive,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] font-medium transition-colors ${
        isActive ? 'bg-[#edf4fd] text-[#1769d1]' : 'text-[#626972] hover:bg-[#f5f6f8] hover:text-[#24282d]'
      }`}
    >
      <span className={isActive ? 'text-[#1769d1]' : 'text-[#949aa2]'}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function EmptyState({ hasActiveFilters }: { hasActiveFilters: boolean }) {
  return (
    <div className="rounded-lg border border-dashed border-[#d9dde2] bg-white px-6 py-16 text-center">
      <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-md bg-[#f1f3f5] text-[#8e959e]">
        {hasActiveFilters ? <SearchIcon /> : <LibraryIcon />}
      </div>

      <h2 className="text-[16px] font-semibold text-[#282c31]">
        {hasActiveFilters ? 'No references found' : 'No references yet'}
      </h2>

      <p className="mx-auto mt-1.5 max-w-sm text-[12px] leading-5 text-[#858c95]">
        {hasActiveFilters
          ? 'Try changing your search or filters.'
          : 'Paste a website URL above to add your first reference.'}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-lg border border-[#e5e8eb] bg-white">
          <div className="aspect-[16/10] animate-pulse bg-[#eef0f2]" />

          <div className="space-y-2.5 p-4">
            <div className="h-3 w-2/3 animate-pulse rounded bg-[#e9ecef]" />
            <div className="h-2.5 w-full animate-pulse rounded bg-[#eef0f2]" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-[#eef0f2]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M15.5 15.5L20 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function LibraryIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M8 8H16M8 12H16M8 16H13" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4L14.35 8.76L19.6 9.52L15.8 13.22L16.7 18.45L12 15.98L7.3 18.45L8.2 13.22L4.4 9.52L9.65 8.76L12 4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7V12L15 14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="14" y="4" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="4" y="14" width="6" height="6" rx="1" fill="currentColor" />
      <rect x="14" y="14" width="6" height="6" rx="1" fill="currentColor" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="2" rx="1" fill="currentColor" />
      <rect x="4" y="11" width="16" height="2" rx="1" fill="currentColor" />
      <rect x="4" y="17" width="16" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7H20M4 12H20M4 17H20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#9aa0a8]"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SmallChevron() {
  return (
    <svg
      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#969da5]"
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M7 10L12 15L17 10" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}