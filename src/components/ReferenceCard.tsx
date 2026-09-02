'use client';

import { useState, type MouseEvent } from 'react';
import { Reference } from '@/types';
import ReferenceModal from './ReferenceModal';

interface ReferenceCardProps {
  reference: Reference;
  onUpdate: (reference: Reference) => void;
  onDelete: (id: string) => void;
  viewMode?: 'grid' | 'list';
}

export function ReferenceCard({
  reference,
  onUpdate,
  onDelete,
  viewMode = 'grid',
}: ReferenceCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(reference.isFavorite);

  const handleToggleFavorite = async (e: MouseEvent) => {
    e.stopPropagation();

    try {
      const response = await fetch(
        `/api/references/${reference.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isFavorite: !isFavorite,
          }),
        }
      );

      if (response.ok) {
        const updated = await response.json();

        setIsFavorite(!isFavorite);
        onUpdate(updated);
      }
    } catch (error) {
      console.error(
        'Failed to update favorite:',
        error
      );
    }
  };

  const handleDelete = async (e: MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Delete this reference?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/references/${reference.id}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        onDelete(reference.id);
      }
    } catch (error) {
      console.error(
        'Failed to delete reference:',
        error
      );
    }
  };

  /*
   * LIST VIEW
   */
  if (viewMode === 'list') {
    return (
      <>
        <div
          onClick={() => setShowModal(true)}
          className="reference-card flex cursor-pointer items-center gap-4 border border-[#e4e7eb] bg-white p-4 transition-all duration-200 hover:border-[#cfd5dc] hover:bg-[#fafbfc] sm:p-5"
        >
          {/* Thumbnail */}
          {reference.thumbnailUrl && (
            <img
              src={reference.thumbnailUrl}
              alt={reference.title}
              className="h-24 w-24 shrink-0 rounded-md bg-[#f1f3f5] object-cover sm:h-28 sm:w-28"
            />
          )}

          {/* Content */}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-[#17191c] transition-colors hover:text-[#1769d1]">
              {reference.title}
            </h3>

            <p className="mb-2 mt-1 truncate text-xs text-[#777e87]">
              {reference.url}
            </p>

            {reference.industry && (
              <span className="mb-3 inline-block rounded-md border border-[#cfdced] bg-[#f2f7fd] px-2.5 py-1 text-xs font-semibold text-[#1769d1]">
                {reference.industry}
              </span>
            )}

            {/* Tags */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {reference.tags
                .slice(0, 3)
                .map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-[#e4e7eb] bg-[#f8f9fb] px-2 py-0.5 text-xs text-[#5f6670]"
                  >
                    {tag}
                  </span>
                ))}

              {reference.tags.length > 3 && (
                <span className="px-2 text-xs font-medium text-[#777e87]">
                  +{reference.tags.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`rounded-md p-2 transition-all duration-200 ${
                isFavorite
                  ? 'bg-[#fff0f0] text-[#d33b3b]'
                  : 'text-[#9298a1] hover:bg-[#fff5f5] hover:text-[#d33b3b]'
              }`}
              title="Toggle favorite"
            >
              {isFavorite ? '❤️' : '🤍'}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="rounded-md p-2 text-[#9298a1] transition-all duration-200 hover:bg-[#fff5f5] hover:text-[#d33b3b]"
              title="Delete reference"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <ReferenceModal
            reference={reference}
            onClose={() => setShowModal(false)}
            onUpdate={onUpdate}
          />
        )}
      </>
    );
  }

  /*
   * GRID VIEW
   */
  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="reference-card group cursor-pointer overflow-hidden rounded-lg border border-[#e4e7eb] bg-white transition-all duration-200 hover:border-[#d2d7dd] hover:shadow-[0_8px_24px_rgba(23,25,28,0.06)]"
      >
        {/* Image */}
        <div className="relative h-48 overflow-hidden bg-[#f1f3f5]">
          {reference.thumbnailUrl ? (
            <img
              src={reference.thumbnailUrl}
              alt={reference.title}
              className="reference-card-image h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="reference-card-image flex h-full w-full items-center justify-center text-[#c4c9cf]">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <rect
                  x="3"
                  y="3"
                  width="18"
                  height="18"
                  rx="2"
                />
                <circle
                  cx="8.5"
                  cy="8.5"
                  r="1.5"
                />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/60 via-black/10 to-transparent p-4 opacity-0 transition-all duration-200 group-hover:opacity-100">
            {/* Favorite */}
            <button
              type="button"
              onClick={handleToggleFavorite}
              className={`rounded-full p-2.5 transition-all duration-200 ${
                isFavorite
                  ? 'bg-[#d33b3b] text-white shadow-lg'
                  : 'bg-white/95 text-[#17191c] hover:bg-white'
              }`}
              title="Toggle favorite"
            >
              {isFavorite ? '❤️' : '🤍'}
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-full bg-white/95 p-2.5 text-[#17191c] transition-all duration-200 hover:bg-[#d33b3b] hover:text-white"
              title="Delete reference"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* Card content */}
        <div className="p-4">
          <h3 className="mb-2 truncate text-sm font-semibold text-[#17191c] transition-colors group-hover:text-[#1769d1]">
            {reference.title}
          </h3>

          <p className="mb-3 truncate text-xs leading-relaxed text-[#777e87]">
            {reference.url}
          </p>

          {/* Industry */}
          {reference.industry && (
            <div className="mb-3">
              <span className="inline-block rounded-md border border-[#cfdced] bg-[#f2f7fd] px-2.5 py-1 text-xs font-semibold text-[#1769d1]">
                {reference.industry}
              </span>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {reference.tags
              .slice(0, 2)
              .map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-[#e4e7eb] bg-[#f8f9fb] px-2 py-0.5 text-xs text-[#5f6670]"
                >
                  {tag}
                </span>
              ))}

            {reference.tags.length > 2 && (
              <span className="px-2 text-xs font-medium text-[#777e87]">
                +{reference.tags.length - 2}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <ReferenceModal
          reference={reference}
          onClose={() => setShowModal(false)}
          onUpdate={onUpdate}
        />
      )}
    </>
  );
}