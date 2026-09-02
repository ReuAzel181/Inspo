import type { Dispatch, SetStateAction } from 'react';
import type { SearchParams } from '@/types';
import { InputField } from '@/components/InputField';
import { MenuIcon, SearchIcon } from './icons';

export function LibraryTopBar({
  sidebarOpen,
  setSidebarOpen,
  searchParams,
  setSearchParams,
}: {
  sidebarOpen: boolean;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
  searchParams: SearchParams;
  setSearchParams: Dispatch<SetStateAction<SearchParams>>;
}) {
  return (
    <header className="mb-7 flex items-center gap-3">
      {/* Mobile sidebar */}
      <button
        type="button"
        onClick={() => setSidebarOpen((open) => !open)}
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors duration-150 lg:hidden ${
          sidebarOpen
            ? 'border-[#c9d8e9] bg-[#f2f6fb] text-[#1769d1]'
            : 'border-[#e1e5e9] bg-white text-[#69717b] hover:border-[#d5dbe1] hover:bg-[#f8f9fa] hover:text-[#30353b]'
        }`}
        aria-expanded={sidebarOpen}
        aria-controls="inspo-sidebar"
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        <MenuIcon />
      </button>

      {/* Search */}
      <InputField
        value={searchParams.query || ''}
        onChange={(event) => {
          setSearchParams((current) => ({
            ...current,
            query: event.target.value || undefined,
          }));
        }}
        placeholder="Search your references"
        aria-label="Search references"
        size="sm"
        status={'default'}
        leadingIcon={<SearchIcon />}
        trailing={
          <div className="hidden items-center gap-1 sm:flex">
            <kbd
              className="
                flex h-5 min-w-5 items-center justify-center
                rounded border border-[#e3e6ea]
                bg-[#f8f9fa]
                px-1.5
                text-[10px] font-medium text-[#8b929b]
              "
            >
              ⌘
            </kbd>

            <kbd
              className="
                flex h-5 min-w-5 items-center justify-center
                rounded border border-[#e3e6ea]
                bg-[#f8f9fa]
                px-1.5
                text-[10px] font-medium text-[#8b929b]
              "
            >
              K
            </kbd>
          </div>
        }
        containerClassName="flex-1"
        inputClassName="h-full"
      />

      {/* Active library */}
      <div
        className="
          hidden h-10 shrink-0 items-center gap-2
          rounded-lg border border-[#cddcf0]
          bg-[#f4f8fd] shadow-[0_0_0_1px_rgba(23,105,209,0.08)]
          px-3.5
          sm:flex
        "
        aria-current="page"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1769d1] text-[10px] font-bold text-white shadow-sm">
          R
        </div>

        <span className="text-[11px] font-semibold text-[#1769d1]">
          My Library
        </span>
      </div>
    </header>
  );
}