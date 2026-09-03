export function PageHeader({
  referenceCount,
  isArchiveView = false,
}: {
  referenceCount: number;
  isArchiveView?: boolean;
}) {
  return (
    <section className="mb-7">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1769d1]">
            {isArchiveView ? 'Your archive' : 'Your collection'}
          </p>

          <div className="flex items-center gap-3">
            {isArchiveView && (
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef5ff] text-[#1769d1]" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                  <path d="M4 7.5h16v11a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-11Z" stroke="currentColor" strokeWidth="1.7" />
                  <path d="M3 4h18v3.5H3V4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                  <path d="M9 11h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
              </span>
            )}

            <h1 className="text-[30px] font-semibold leading-[1.15] tracking-[-0.025em] text-[#17191c] sm:text-[34px]">
            {isArchiveView ? 'Archive' : 'References'}
            </h1>
          </div>

          <p className="mt-2 max-w-xl text-[13px] leading-5 text-[#777e87]">
            {isArchiveView
              ? 'References you have archived for later.'
              : 'A curated archive of websites, interfaces, and visual ideas.'}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[26px] font-semibold leading-none text-[#24282d]">{referenceCount}</div>
          <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#979da5]">
            {isArchiveView ? 'Archived' : 'References'}
          </div>
        </div>
      </div>
    </section>
  );
}
