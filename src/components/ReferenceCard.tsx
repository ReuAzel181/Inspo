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

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

function HeartIcon({
  filled = false,
  className = '',
}: {
  filled?: boolean;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-4 w-4 ${className}`}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" />
    </svg>
  );
}

function TrashIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`h-4 w-4 ${className}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 15H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

function ImagePlaceholderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-8 w-8"
      fill="currentColor"
    >
      <path d="M4 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4Zm0 2h16v12H4V6Zm2 9 3.5-4 2.5 3 2-2.5L20 17H6l.5-2Z" />
      <path d="M8 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Image Preview                                                              */
/* -------------------------------------------------------------------------- */

/*
 * The important difference here:
 *
 * We DO NOT use object-contain.
 * We DO NOT force the entire image into the card.
 *
 * Instead, the image is intentionally larger than the preview area.
 * The preview acts as a viewport/window over the image.
 *
 * This keeps screenshots visually zoomed and prevents the entire large
 * screenshot from being aggressively reduced to the card dimensions.
 */

function ImagePreview({
  src,
  alt,
  objectPosition = 'top',
  className = '',
}: {
  src: string;
  alt: string;
  objectPosition?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden bg-[#f1f3f5] ${className}`}
    >
      <img
        src={src}
        alt={alt}
        className="absolute left-0 top-0 h-auto w-[145%] max-w-none select-none"
        style={{
          objectPosition,
          imageRendering: 'auto',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

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
      const response = await fetch(`/api/references/${reference.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isFavorite: !isFavorite,
        }),
      });

      if (response.ok) {
        const updated = await response.json();

        setIsFavorite(!isFavorite);
        onUpdate(updated);
      }
    } catch (error) {
      console.error('Failed to update favorite:', error);
    }
  };

  const handleDelete = async (e: MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Delete this reference?')) {
      return;
    }

    try {
      const response = await fetch(`/api/references/${reference.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete(reference.id);
      }
    } catch (error) {
      console.error('Failed to delete reference:', error);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* List View                                                                */
  /* ------------------------------------------------------------------------ */

  if (viewMode === 'list') {
    return (
      <>
        <article
          onClick={() => setShowModal(true)}
          className="group flex cursor-pointer items-center gap-4 rounded-xl border border-[#e5e7eb] bg-white p-4 transition-colors duration-150 hover:border-[#d5d9df] hover:bg-[#fafbfc] sm:p-5"
        >
          {/* Image */}
          <div className="relative flex h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#f1f3f5] sm:h-24 sm:w-24">
            {reference.thumbnailUrl ? (
              <div className="flex h-full w-full">
                <ImagePreview
                  src={reference.thumbnailUrl}
                  alt={reference.title}
                  objectPosition={reference.thumbnailPosition || 'top'}
                  className={
                    reference.additionalImageUrls?.length
                      ? 'h-full w-1/2'
                      : 'h-full w-full'
                  }
                />

                {reference.additionalImageUrls?.[0] && (
                  <ImagePreview
                    src={reference.additionalImageUrls[0]}
                    alt={`${reference.title} secondary image`}
                    objectPosition={
                      reference.additionalImagePositions?.[0] || 'top'
                    }
                    className="h-full w-1/2"
                  />
                )}
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[#b8bec7]">
                <ImagePlaceholderIcon />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-[#17191c]">
              {reference.title}
            </h3>

            <p className="mt-1 truncate text-xs text-[#8a919b]">
              {reference.url}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {reference.industry && (
                <span className="rounded-md bg-[#eef5ff] px-2 py-1 text-[11px] font-semibold text-[#1769d1]">
                  {reference.industry}
                </span>
              )}

              {reference.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-[#f5f6f8] px-2 py-1 text-[11px] font-medium text-[#646b75]"
                >
                  {tag}
                </span>
              ))}

              {reference.tags.length > 3 && (
                <span className="text-[11px] font-medium text-[#9298a1]">
                  +{reference.tags.length - 3}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={handleToggleFavorite}
              aria-label={isFavorite ? 'Remove favorite' : 'Add favorite'}
              title={isFavorite ? 'Remove favorite' : 'Add favorite'}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                isFavorite
                  ? 'bg-[#fff1f1] text-[#d33b3b]'
                  : 'text-[#9aa0a8] hover:bg-[#f5f6f8] hover:text-[#d33b3b]'
              }`}
            >
              <HeartIcon filled={isFavorite} />
            </button>

            <button
              type="button"
              onClick={handleDelete}
              aria-label="Delete reference"
              title="Delete reference"
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[#9aa0a8] transition-colors hover:bg-[#fff1f1] hover:text-[#d33b3b]"
            >
              <TrashIcon />
            </button>
          </div>
        </article>

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

  /* ------------------------------------------------------------------------ */
  /* Grid View                                                                */
  /* ------------------------------------------------------------------------ */

  return (
    <>
      <article
        onClick={() => setShowModal(true)}
        className="group cursor-pointer overflow-hidden rounded-xl border border-[#e5e7eb] bg-white transition-colors duration-150 hover:border-[#d5d9df]"
      >
        {/* Image */}
        <div className="relative h-56 overflow-hidden bg-[#f1f3f5]">
          {reference.thumbnailUrl ? (
            <div className="flex h-full w-full">
              <ImagePreview
                src={reference.thumbnailUrl}
                alt={reference.title}
                objectPosition={reference.thumbnailPosition || 'top'}
                className={
                  reference.additionalImageUrls?.length
                    ? 'h-full w-1/2'
                    : 'h-full w-full'
                }
              />

              {reference.additionalImageUrls?.[0] && (
                <ImagePreview
                  src={reference.additionalImageUrls[0]}
                  alt={`${reference.title} secondary image`}
                  objectPosition={
                    reference.additionalImagePositions?.[0] || 'top'
                  }
                  className="h-full w-1/2"
                />
              )}
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#b8bec7]">
              <ImagePlaceholderIcon />
            </div>
          )}

          {/* Overlay */}
          <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-150 group-hover:bg-black/30" />

          {/* Actions */}
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <button
              type="button"
              onClick={handleToggleFavorite}
              aria-label={isFavorite ? 'Remove favorite' : 'Add favorite'}
              title={isFavorite ? 'Remove favorite' : 'Add favorite'}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
                isFavorite
                  ? 'bg-[#d33b3b] text-white'
                  : 'bg-white text-[#30343a] hover:bg-[#f3f4f6] hover:text-[#d33b3b]'
              }`}
            >
              <HeartIcon filled={isFavorite} />
            </button>

            <button
              type="button"
              onClick={handleDelete}
              aria-label="Delete reference"
              title="Delete reference"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#30343a] transition-colors hover:bg-[#f3f4f6] hover:text-[#d33b3b]"
            >
              <TrashIcon />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="truncate text-[14px] font-semibold tracking-[-0.01em] text-[#17191c]">
            {reference.title}
          </h3>

          <p className="mt-1.5 truncate text-xs text-[#8a919b]">
            {reference.url}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {reference.industry && (
              <span className="rounded-md bg-[#eef5ff] px-2 py-1 text-[11px] font-semibold text-[#1769d1]">
                {reference.industry}
              </span>
            )}

            {reference.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-[#f5f6f8] px-2 py-1 text-[11px] font-medium text-[#646b75]"
              >
                {tag}
              </span>
            ))}

            {reference.tags.length > 2 && (
              <span className="text-[11px] font-medium text-[#9298a1]">
                +{reference.tags.length - 2}
              </span>
            )}
          </div>
        </div>
      </article>

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