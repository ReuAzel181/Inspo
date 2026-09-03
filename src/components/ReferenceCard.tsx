'use client';

import { useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { Reference } from '@/types';
import ReferenceModal from './ReferenceModal';

interface ReferenceCardProps {
  reference: Reference;
  onUpdate: (reference: Reference) => void;
  onDelete: (reference: Reference) => void;
  onRestore: (id: string) => void;
  isArchiveView: boolean;
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
/* Image Position                                                             */
/* -------------------------------------------------------------------------- */

/*
 * Supports the position values used by the reference data:
 *
 *   "top"
 *   "center"
 *   "bottom"
 *
 * It also accepts common CSS-style values such as:
 *
 *   "top center"
 *   "center center"
 *   "bottom center"
 *   "50%"
 *
 * The horizontal position is intentionally always centered because the
 * complete left-to-right width of the image must remain visible.
 */

function getVerticalPosition(position: string): 'top' | 'center' | 'bottom' {
  const value = position.toLowerCase().trim();

  if (
    value === 'bottom' ||
    value.startsWith('bottom ') ||
    value.endsWith(' bottom') ||
    value === '100%'
  ) {
    return 'bottom';
  }

  if (
    value === 'center' ||
    value.startsWith('center ') ||
    value.endsWith(' center') ||
    value === '50%'
  ) {
    return 'center';
  }

  return 'top';
}

/* -------------------------------------------------------------------------- */
/* Image Preview                                                              */
/* -------------------------------------------------------------------------- */

/*
 * Important:
 *
 * We do NOT use object-cover.
 * We do NOT enlarge the image horizontally.
 *
 * The image is rendered at exactly 100% of the viewport width, preserving
 * its original aspect ratio. Therefore the entire left-to-right image is
 * visible.
 *
 * If the resulting image is taller than the preview area, only the vertical
 * portion is cropped.
 *
 * top    -> shows the top of the screenshot
 * center -> shows the center of the screenshot
 * bottom -> shows the bottom of the screenshot
 *
 * This avoids the horizontal crop introduced by object-cover and avoids
 * the additional resampling caused by scaling the image beyond its natural
 * display width.
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
  const verticalPosition = getVerticalPosition(objectPosition);

  const positionClass =
    verticalPosition === 'top'
      ? 'top-0'
      : verticalPosition === 'bottom'
        ? 'bottom-0'
        : 'top-1/2 -translate-y-1/2';

  return (
    <div
      className={`relative h-full min-w-0 overflow-hidden bg-[#f1f3f5] ${className}`}
    >
      <img
        src={src}
        alt={alt}
        className={`absolute left-0 w-full max-w-none select-none ${positionClass}`}
        style={{
          height: 'auto',
          imageRendering: 'auto',
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
  onRestore,
  isArchiveView,
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

  const handleDelete = (e: MouseEvent) => {
    e.stopPropagation();
    onDelete(reference);
  };

  const handleRestore = async (e: MouseEvent) => {
    e.stopPropagation();
    const response = await fetch(`/api/references/${reference.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isArchived: false }),
    });

    if (response.ok) {
      onRestore(reference.id);
    }
  };

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
          <div className={`absolute inset-x-0 bottom-0 flex items-center p-3 opacity-0 transition-opacity duration-150 group-hover:opacity-100 ${isArchiveView ? 'justify-end' : 'justify-between'}`}>
            {!isArchiveView && <button
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
            </button>}

            {isArchiveView ? (
              <button
                type="button"
                onClick={handleRestore}
                aria-label="Recover reference"
                title="Recover reference"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#30343a] transition-colors hover:bg-[#f3f4f6] hover:text-[#1769d1]"
              >
                <TrashIcon className="rotate-180" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDelete}
                aria-label="Archive reference"
                title="Archive reference"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#30343a] transition-colors hover:bg-[#f3f4f6] hover:text-[#d33b3b]"
              >
                <TrashIcon />
              </button>
            )}
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
            {reference.industry && reference.industry !== 'Other' && (
              <span className="rounded-md bg-[#eef5ff] px-2 py-1 text-[11px] font-semibold text-[#1769d1]">
                {reference.industry}
              </span>
            )}

            {reference.tags
              .filter((tag) => tag !== 'Other')
              .map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-[#f5f6f8] px-2 py-1 text-[11px] font-medium text-[#646b75]"
                >
                  {tag}
                </span>
              ))}
          </div>
        </div>
      </article>

      {showModal && (
        typeof document !== 'undefined'
          ? createPortal(
              <ReferenceModal
                reference={reference}
                onClose={() => setShowModal(false)}
                onUpdate={onUpdate}
              />,
              document.body
            )
          : null
      )}
    </>
  );
}