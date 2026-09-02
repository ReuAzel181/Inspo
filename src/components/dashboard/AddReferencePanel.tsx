
import type { Reference } from '@/types';
import { URLInput } from '@/components/URLInput';

export function AddReferencePanel({
  onAdd,
}: {
  onAdd: (reference: Reference) => void;
}) {
  return (
    <section className="mb-8">
      <div className="rounded-xl border border-[#dce5f0] bg-[#f7faff] p-4 sm:p-5">
        <div className="mb-4 flex items-start gap-3">

          <div>
            <h2 className="text-[14px] font-semibold leading-5 text-[#1d2938]">
              Add a reference
            </h2>

            <p className="mt-0.5 text-[12px] leading-5 text-[#687587]">
              Paste a website URL to add it to your collection.
            </p>
          </div>
        </div>

        <div className="[&_input]:h-11 [&_button]:h-11">
          <URLInput onAdd={onAdd} />
        </div>
      </div>
    </section>
  );
}