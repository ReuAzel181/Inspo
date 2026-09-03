'use client';

import { Reference } from '@/types';
import { ReferenceCard } from './ReferenceCard';

interface ReferenceGridProps {
  references: Reference[];
  onUpdate: (reference: Reference) => void;
  onDelete: (reference: Reference) => void;
  onRestore: (id: string) => void;
  isArchiveView: boolean;
}

export function ReferenceGrid({
  references,
  onUpdate,
  onDelete,
  onRestore,
  isArchiveView,
}: ReferenceGridProps) {
  return (
    <div className="grid-references">
      {references.map((ref) => (
        <ReferenceCard
          key={ref.id}
          reference={ref}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onRestore={onRestore}
          isArchiveView={isArchiveView}
        />
      ))}
    </div>
  );
}
