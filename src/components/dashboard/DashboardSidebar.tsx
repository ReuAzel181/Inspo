import type { Dispatch, SetStateAction } from 'react';
import { DESIGN_TAGS, INDUSTRY_CATEGORIES, type SearchParams } from '@/types';
import { ArchiveIcon, CheckIcon, ChevronIcon, ClockIcon, LibraryIcon, StarIcon } from './icons';

type LibraryView = 'all' | 'favorites' | 'recent' | 'archive';

export function DashboardSidebar({
  sidebarOpen,
  libraryView,
  searchParams,
  setSearchParams,
  showAllReferences,
  showFavorites,
  showRecentlyAdded,
  showArchive,
  handleTagChange,
  setSidebarOpen,
}: {
  sidebarOpen: boolean;
  libraryView: LibraryView;
  searchParams: SearchParams;
  setSearchParams: Dispatch<SetStateAction<SearchParams>>;
  showAllReferences: () => void;
  showFavorites: () => void;
  showRecentlyAdded: () => void;
  showArchive: () => void;
  handleTagChange: (tag: string, checked: boolean) => void;
  setSidebarOpen: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <>
      <aside
        id="inspo-sidebar"
        className={`fixed inset-y-0 left-0 z-40 w-[248px] border-r border-[#e4e7eb] bg-white transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-[72px] items-center border-b border-[#e9ebee] px-6">
            <div>
              <div className="text-[17px] font-semibold tracking-[-0.02em] text-[#16181b]">Inspo</div>
              <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#8b9199]">
                Design Library
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6">
            <section className="mb-8">
              <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9298a1]">
                Collection
              </div>

              <nav className="space-y-0.5">
                <NavItem label="All references" icon={<LibraryIcon />} isActive={libraryView === 'all'} onClick={showAllReferences} />
                <NavItem label="Favorites" icon={<StarIcon />} isActive={libraryView === 'favorites'} onClick={showFavorites} />
                <NavItem label="Recently added" icon={<ClockIcon />} isActive={libraryView === 'recent'} onClick={showRecentlyAdded} />
                <NavItem label="Archive" icon={<ArchiveIcon />} isActive={libraryView === 'archive'} onClick={showArchive} />
              </nav>
            </section>

            <section className="mb-8">
              <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9298a1]">
                Tags
              </div>

              <div className="space-y-0.5">
                {DESIGN_TAGS.map((tag) => {
                  const checked = searchParams.tags?.includes(tag) || false;

                  return (
                    <label
                      key={tag}
                      className={`flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors ${
                        checked
                          ? 'bg-[#eff6ff] text-[#1769d1]'
                          : 'text-[#5f6670] hover:bg-[#f5f6f8] hover:text-[#24282d]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          handleTagChange(tag, event.target.checked);
                        }}
                        className="sr-only"
                      />

                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[3px] border ${
                          checked ? 'border-[#1769d1] bg-[#1769d1]' : 'border-[#cbd0d6] bg-white'
                        }`}
                      >
                        {checked && <span className="text-white"><CheckIcon /></span>}
                      </span>

                      <span>{tag}</span>
                    </label>
                  );
                })}
              </div>
            </section>

            <section>
              <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9298a1]">
                Industry
              </div>

              <div className="relative">
                <select
                  value={searchParams.industry || ''}
                  onChange={(event) => {
                    setSearchParams((current) => ({
                      ...current,
                      industry: event.target.value || undefined,
                    }));
                  }}
                  className="h-9 w-full appearance-none rounded-md border border-[#dfe3e8] bg-white px-3 pr-8 text-[12px] text-[#454b53] outline-none transition-colors hover:border-[#c8cdd4] focus:border-[#1769d1] focus:ring-2 focus:ring-[#1769d1]/10"
                  aria-label="Filter by industry"
                >
                  <option value="">All industries</option>
                  {INDUSTRY_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <ChevronIcon />
              </div>
            </section>
          </div>

          <div className="border-t border-[#e9ebee] px-6 py-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-[#a0a5ac]">Private collection</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#1769d1]" />
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close filters"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
        />
      )}
    </>
  );
}

function NavItem({
  label,
  icon,
  isActive,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] font-medium transition-colors ${
        isActive ? 'bg-[#edf4fd] text-[#1769d1]' : 'text-[#626972] hover:bg-[#f5f6f8] hover:text-[#24282d]'
      }`}
    >
      <span className={isActive ? 'text-[#1769d1]' : 'text-[#949aa2]'}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
