export function PageHeader({ referenceCount }: { referenceCount: number }) {
  return (
    <section className="mb-7">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1769d1]">
            Your collection
          </p>

          <h1 className="text-[30px] font-semibold leading-[1.15] tracking-[-0.025em] text-[#17191c] sm:text-[34px]">
            References
          </h1>

          <p className="mt-2 max-w-xl text-[13px] leading-5 text-[#777e87]">
            A curated archive of websites, interfaces, and visual ideas.
          </p>
        </div>

        <div className="hidden text-right sm:block">
          <div className="text-[20px] font-semibold leading-none text-[#24282d]">{referenceCount}</div>
          <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#979da5]">
            References
          </div>
        </div>
      </div>
    </section>
  );
}
