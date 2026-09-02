'use client';

import { Reference } from '@/types';
import { ReferenceCard } from './ReferenceCard';

interface ReferenceGridProps {
  references: Reference[];
  viewMode: 'grid' | 'list';
  onUpdate: (reference: Reference) => void;
  onDelete: (id: string) => void;
}

export function ReferenceGrid({
  references,
  viewMode,
  onUpdate,
  onDelete,
}: ReferenceGridProps) {
  if (viewMode === 'list') {
    return (
      <div className="list-references">
        {references.map((ref) => (
          <ReferenceCard
            key={ref.id}
            reference={ref}
            onUpdate={onUpdate}
            onDelete={onDelete}
            viewMode="list"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid-references">
      {references.map((ref) => (
        <ReferenceCard
          key={ref.id}
          reference={ref}
          onUpdate={onUpdate}
          onDelete={onDelete}
          viewMode="grid"
        />
      ))}
    </div>
  );
}
