'use client';

import { useEffect, useState } from 'react';
import { AddReferencePanel } from '@/components/dashboard/AddReferencePanel';
import { DashboardSidebar } from '@/components/dashboard/DashboardSidebar';
import { LibraryContent } from '@/components/dashboard/LibraryContent';
import { LibraryTopBar } from '@/components/dashboard/LibraryTopBar';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ActionToast } from '@/components/dashboard/ActionToast';
import { Reference, SearchParams } from '@/types';

type LibraryView = 'all' | 'favorites' | 'recent' | 'archive';

export default function DashboardPage() {
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [libraryView, setLibraryView] = useState<LibraryView>('all');
  const [searchParams, setSearchParams] = useState<SearchParams>({
    sortBy: 'recent',
  });
  const [pendingDelete, setPendingDelete] = useState<Reference | null>(null);
  const [archivedToast, setArchivedToast] = useState<Reference | null>(null);

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
        if (searchParams.isArchived !== undefined) {
          query.set('isArchived', String(searchParams.isArchived));
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

  const handleDeleteReference = (reference: Reference) => {
    setPendingDelete(reference);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;

    const reference = pendingDelete;
    const response = await fetch(`/api/references/${reference.id}`, {
      method: 'DELETE',
    });

    if (response.ok) {
      setReferences((current) =>
        current.filter((currentReference) => currentReference.id !== reference.id)
      );
      setPendingDelete(null);
      setArchivedToast(reference);
    }
  };

  const handleRestoreReference = (id: string) => {
    setReferences((current) => current.filter((reference) => reference.id !== id));
  };

  const handleUndoArchive = async () => {
    if (!archivedToast) return;

    const reference = archivedToast;
    const response = await fetch(`/api/references/${reference.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isArchived: false }),
    });

    if (response.ok) {
      setReferences((current) => [reference, ...current]);
      setArchivedToast(null);
    }
  };

  const hasActiveFilters = Boolean(
    searchParams.query ||
      searchParams.tags?.length ||
      searchParams.industry ||
        searchParams.isFavorite ||
        searchParams.isArchived
  );

  const showAllReferences = () => {
    setLibraryView('all');
    setSearchParams({
      ...searchParams,
      sortBy: 'recent',
      isFavorite: undefined,
      isArchived: false,
    });
  };

  const showFavorites = () => {
    setLibraryView('favorites');
    setSearchParams({
      ...searchParams,
      isFavorite: true,
      isArchived: false,
    });
  };

  const showRecentlyAdded = () => {
    setLibraryView('recent');
    setSearchParams({
      ...searchParams,
      sortBy: 'recent',
      isFavorite: undefined,
      isArchived: false,
    });
  };

  const showArchive = () => {
    setLibraryView('archive');
    setSearchParams({
      ...searchParams,
      isFavorite: undefined,
      isArchived: true,
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
        showArchive={showArchive}
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

          <PageHeader
            referenceCount={references.length}
            isArchiveView={libraryView === 'archive'}
          />

          <AddReferencePanel onAdd={handleAddReference} />

          <LibraryContent
            loading={loading}
            references={references}
            hasActiveFilters={hasActiveFilters}
            onUpdate={handleUpdateReference}
            onDelete={handleDeleteReference}
            onRestore={handleRestoreReference}
            isArchiveView={libraryView === 'archive'}
          />
        </div>
      </main>

      {pendingDelete && (
        <ActionToast
          variant="confirm"
          message={`Delete '${pendingDelete.title}'?`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {archivedToast && (
        <ActionToast
          variant="undo"
          message={`'${archivedToast.title}' moved to Archive`}
          onUndo={handleUndoArchive}
          onCancel={() => setArchivedToast(null)}
        />
      )}
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