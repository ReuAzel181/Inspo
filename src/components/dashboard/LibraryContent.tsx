import type { Reference } from '@/types';
import { ReferenceGrid } from '@/components/ReferenceGrid';
import { LibraryIcon, SearchIcon } from './icons';

export function LibraryContent({
  loading,
  references,
  hasActiveFilters,
  onUpdate,
  onDelete,
  onRestore,
  isArchiveView,
}: {
  loading: boolean;
  references: Reference[];
  hasActiveFilters: boolean;
  onUpdate: (reference: Reference) => void;
  onDelete: (reference: Reference) => void;
  onRestore: (id: string) => void;
  isArchiveView: boolean;
}) {
  const contentKey = loading
    ? 'loading'
    : references.length > 0
      ? references.map((reference) => reference.id).join('-')
      : 'empty';

  return (
    <section className="pb-12">
      <div key={contentKey} className="library-content-transition">
        {loading ? (
          <LoadingState />
        ) : references.length === 0 ? (
          <EmptyState hasActiveFilters={hasActiveFilters} />
        ) : (
          <ReferenceGrid references={references} onUpdate={onUpdate} onDelete={onDelete} onRestore={onRestore} isArchiveView={isArchiveView} />
        )}
      </div>
    </section>
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
