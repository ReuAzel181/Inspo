'use client';

import { useState } from 'react';
import { Reference } from '@/types';

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
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg opacity-60">🔗</span>
          <input
            type="url"
            placeholder="Paste a website URL... (e.g., www.example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            className="h-12 w-full rounded-lg border border-blue-200/60 bg-white pl-12 pr-4 text-sm text-slate-900 shadow-sm transition hover:shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="btn-primary rounded-lg px-8 py-3 text-sm font-semibold whitespace-nowrap shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="inline-block animate-spin">⏳</span>
              <span>Adding...</span>
            </>
          ) : (
            <>
              <span>➕</span>
              <span>Add Reference</span>
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
