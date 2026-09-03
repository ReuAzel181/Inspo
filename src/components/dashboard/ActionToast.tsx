'use client';

import { useEffect, useRef } from 'react';

type ActionToastVariant = 'confirm' | 'undo';

interface ActionToastProps {
  variant: ActionToastVariant;
  message: string;

  onConfirm?: () => void;
  onCancel?: () => void;
  onUndo?: () => void;

  duration?: number;
}

export function ActionToast({
  variant,
  message,
  onConfirm,
  onCancel,
  onUndo,
  duration = 6000,
}: ActionToastProps) {
  const isConfirm = variant === 'confirm';
  const dismissRef = useRef(onCancel);

  dismissRef.current = onCancel;

  useEffect(() => {
    if (isConfirm) return;

    const timeout = window.setTimeout(() => {
      dismissRef.current?.();
    }, duration);

    return () => window.clearTimeout(timeout);
  }, [duration, isConfirm]);

  return (
    <div
      className={
        isConfirm
          ? 'fixed inset-0 z-[100] flex items-center justify-center bg-[#17191c]/35 px-4'
          : 'fixed bottom-5 left-1/2 z-[100] w-[calc(100vw-2rem)] max-w-[440px] -translate-x-1/2'
      }
    >
      <div
        role={isConfirm ? 'alertdialog' : 'status'}
        aria-live={isConfirm ? undefined : 'polite'}
        aria-modal={isConfirm ? true : undefined}
        className={`
          w-full
          overflow-hidden
          rounded-xl
          border
          shadow-[0_18px_45px_rgba(0,0,0,0.14)]
          animate-[toast-in_180ms_ease-out]
          ${
            isConfirm
              ? 'max-w-[440px] border-[#e4e7eb] bg-white text-[#17191c]'
              : 'border-[#e4e7eb] bg-white text-[#17191c]'
          }
        `}
      >
        {/* Main content */}
        <div className="px-4 py-3">
          {isConfirm ? (
            <>
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f59e0b]/10 text-[#d97706]"
                  aria-hidden="true"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-4 w-4"
                  >
                    <path
                      d="M12 8v4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="12"
                      cy="16"
                      r="1"
                      fill="currentColor"
                    />
                    <path
                      d="M10.3 4.9 3.2 17a2 2 0 0 0 1.73 3h14.14a2 2 0 0 0 1.73-3L13.7 4.9a2 2 0 0 0-3.4 0Z"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>

                {/* Message */}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium leading-5 text-[#17191c]">
                    {message}
                  </p>

                  <p className="mt-0.5 text-[12px] leading-5 text-[#626972]">
                    This action can’t be undone after the confirmation expires.
                  </p>
                </div>

                {/* Close */}
                <button
                  type="button"
                  onClick={onCancel}
                  aria-label="Dismiss notification"
                  className="
                    -mr-1
                    flex
                    h-7
                    w-7
                    shrink-0
                    items-center
                    justify-center
                    rounded-md
                    text-[#9298a1]
                    transition-colors
                    hover:bg-[#f5f6f8]
                    hover:text-[#17191c]
                  "
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    className="h-4 w-4"
                  >
                    <path
                      d="M5 5 15 15M15 5 5 15"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Confirmation actions */}
              <div className="mt-3 flex items-center justify-end gap-2 border-t border-[#e4e7eb] pt-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="
                    rounded-lg
                    px-3
                    py-1.5
                    text-[12px]
                    font-semibold
                    text-[#626972]
                    transition-colors
                    hover:bg-[#f5f6f8]
                    hover:text-[#17191c]
                  "
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={onConfirm}
                  className="
                    rounded-lg
                    bg-[#dc5c5c]
                    px-3.5
                    py-1.5
                    text-[12px]
                    font-semibold
                    text-white
                    transition-all
                    hover:bg-[#e66b6b]
                    active:scale-[0.98]
                  "
                >
                  Delete
                </button>
              </div>
            </>
          ) : (
            /* Undo: everything on ONE row */
            <div className="flex items-center gap-3">
              {/* Success icon */}
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eff6ff] text-[#2563eb]"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4"
                >
                  <path
                    d="M5 12.5 9.5 17 19 7.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              {/* Message */}
              <p className="min-w-0 flex-1 text-[13px] font-medium leading-5 text-[#17191c]">
                {message}
              </p>

              {/* Primary Undo button */}
              <button
                type="button"
                onClick={onUndo}
                className="
                  shrink-0
                  rounded-lg
                  bg-[#2563eb]
                  px-3.5
                  py-1.5
                  text-[12px]
                  font-semibold
                  text-white
                  transition-all
                  hover:bg-[#1d4ed8]
                  active:scale-[0.98]
                  focus:outline-none
                  focus:ring-2
                  focus:ring-[#2563eb]/25
                "
              >
                Undo
              </button>
            </div>
          )}
        </div>

        {/* Undo countdown */}
        {!isConfirm && (
          <div className="h-[2px] w-full bg-[#eff6ff]">
            <div
              className="h-full origin-left bg-[#2563eb]"
              style={{
                animation: `toast-countdown ${duration}ms linear forwards`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}