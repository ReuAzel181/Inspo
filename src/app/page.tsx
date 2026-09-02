'use client';

import { useEffect, useState } from 'react';
import { AddReferencePanel } from '@/components/dashboard/AddReferencePanel';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { LibraryContent } from '@/components/dashboard/LibraryContent';
import { LibraryTopBar } from '@/components/dashboard/LibraryTopBar';
import { LibraryToolbar } from '@/components/dashboard/LibraryToolbar';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Reference, SearchParams } from '@/types';

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