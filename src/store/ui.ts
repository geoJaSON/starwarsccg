import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Side, StatusFilter, SortMode, ViewMode } from '@/types';

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

interface UiState {
  // Filters (not persisted — reset on reload).
  search: string;
  side: 'all' | Side;
  sets: string[];
  rarityGroups: string[];
  types: string[];
  status: StatusFilter;

  // View prefs (persisted).
  sort: SortMode;
  view: ViewMode;

  // Detail modal.
  selectedId: number | null;

  setSearch: (v: string) => void;
  setSide: (v: 'all' | Side) => void;
  toggleSet: (id: string) => void;
  toggleRarityGroup: (g: string) => void;
  toggleType: (t: string) => void;
  setStatus: (s: StatusFilter) => void;
  setSort: (s: SortMode) => void;
  setView: (v: ViewMode) => void;
  clearFilters: () => void;
  hasActiveFilters: () => boolean;

  select: (id: number | null) => void;
}

const FILTER_DEFAULTS = {
  search: '',
  side: 'all' as const,
  sets: [] as string[],
  rarityGroups: [] as string[],
  types: [] as string[],
  status: 'all' as StatusFilter,
};

export const useUi = create<UiState>()(
  persist(
    (set, get) => ({
      ...FILTER_DEFAULTS,
      sort: 'set',
      view: 'grid',
      selectedId: null,

      setSearch: (search) => set({ search }),
      setSide: (side) => set({ side }),
      toggleSet: (id) => set((s) => ({ sets: toggle(s.sets, id) })),
      toggleRarityGroup: (g) => set((s) => ({ rarityGroups: toggle(s.rarityGroups, g) })),
      toggleType: (t) => set((s) => ({ types: toggle(s.types, t) })),
      setStatus: (status) => set({ status }),
      setSort: (sort) => set({ sort }),
      setView: (view) => set({ view }),
      clearFilters: () => set({ ...FILTER_DEFAULTS }),
      hasActiveFilters: () => {
        const s = get();
        return (
          s.search !== '' ||
          s.side !== 'all' ||
          s.sets.length > 0 ||
          s.rarityGroups.length > 0 ||
          s.types.length > 0 ||
          s.status !== 'all'
        );
      },

      select: (selectedId) => set({ selectedId }),
    }),
    {
      name: 'swccg-ui',
      partialize: (state) => ({ sort: state.sort, view: state.view }),
    }
  )
);
