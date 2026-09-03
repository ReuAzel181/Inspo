'use client';

import { useState } from 'react';
import { InputField } from '@/components/InputField';
import type { Reference } from '@/types';

interface URLInputProps {
  onAdd: (reference: Reference) => void;
}

export function URLInput({ onAdd }: URLInputProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to add reference');
        return;
      }

      onAdd(data);
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col gap-3 sm:flex-row">
        <InputField
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          status={'default'}
          size="sm"
          placeholder="Paste a website URL... (e.g., www.example.com)"
          leadingIcon={<LinkIcon />}
          containerClassName="min-w-0 flex-1"
          inputClassName="h-full text-[12px]"
        />

        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="btn-primary inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3 text-sm font-semibold whitespace-nowrap shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="inline-block animate-spin text-white">⏳</span>
              <span className="text-white">Adding...</span>
            </>
          ) : (
            <>
              <span className="flex h-4 w-4 items-center justify-center text-white"><PlusIcon /></span>
              <span className="text-white">Add Reference</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-sm">
          <span className="mt-0.5 flex-shrink-0 text-lg">⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </form>
  );
}

function LinkIcon() {
  return (
      <svg
        width="18"
        height="18"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="block text-gray-400"
      >
      <path
        d="M7.05025 1.53553C8.03344 0.552348 9.36692 0 10.7574 0C13.6528 0 16 2.34721 16 5.24264C16 6.63308 15.4477 7.96656 14.4645 8.94975L12.4142 11L11 9.58579L13.0503 7.53553C13.6584 6.92742 14 6.10264 14 5.24264C14 3.45178 12.5482 2 10.7574 2C9.89736 2 9.07258 2.34163 8.46447 2.94975L6.41421 5L5 3.58579L7.05025 1.53553Z"
        fill="currentColor"
      />
      <path
        d="M7.53553 13.0503L9.58579 11L11 12.4142L8.94975 14.4645C7.96656 15.4477 6.63308 16 5.24264 16C2.34721 16 0 13.6528 0 10.7574C0 9.36693 0.552347 8.03344 1.53553 7.05025L3.58579 5L5 6.41421L2.94975 8.46447C2.34163 9.07258 2 9.89736 2 10.7574C2 12.5482 3.45178 14 5.24264 14C6.10264 14 6.92742 13.6584 7.53553 13.0503Z"
        fill="currentColor"
      />
      <path
        d="M5.70711 11.7071L11.7071 5.70711L10.2929 4.29289L4.29289 10.2929L5.70711 11.7071Z"
        fill="currentColor"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="block"
    >
      <path
        d="M6 12H18M12 6V18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
