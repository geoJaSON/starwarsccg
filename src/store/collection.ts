import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import type { CollectionEntry, Condition } from '@/types';

const idbStorage: StateStorage = {
  getItem: async (name) => (await idbGet(name)) ?? null,
  setItem: async (name, value) => {
    await idbSet(name, value);
  },
  removeItem: async (name) => {
    await idbDel(name);
  },
};

/** An entry is "empty" once it carries no information and can be dropped. */
function isEmpty(e: CollectionEntry): boolean {
  return (
    (e.qty ?? 0) <= 0 &&
    (e.foil ?? 0) <= 0 &&
    !e.want &&
    !e.condition &&
    !(e.notes && e.notes.trim())
  );
}

export function isOwned(e?: CollectionEntry): boolean {
  return !!e && ((e.qty ?? 0) > 0 || (e.foil ?? 0) > 0);
}

interface CollectionState {
  entries: Record<number, CollectionEntry>;
  hydrated: boolean;
  setHydrated: () => void;

  patch: (id: number, change: Partial<CollectionEntry>) => void;
  setQty: (id: number, qty: number) => void;
  adjustQty: (id: number, delta: number) => void;
  setFoil: (id: number, foil: number) => void;
  adjustFoil: (id: number, delta: number) => void;
  toggleWant: (id: number) => void;
  setCondition: (id: number, condition?: Condition) => void;
  setNotes: (id: number, notes: string) => void;
  /** Mark owned with at least one copy (no-op if already owned). */
  acquire: (id: number) => void;
  remove: (id: number) => void;

  replaceAll: (entries: Record<number, CollectionEntry>) => void;
  reset: () => void;
}

export const useCollection = create<CollectionState>()(
  persist(
    (set, getState) => {
      const apply = (id: number, change: Partial<CollectionEntry>) => {
        set((state) => {
          const current = state.entries[id] ?? { qty: 0 };
          const next: CollectionEntry = { ...current, ...change };
          if (next.qty < 0) next.qty = 0;
          if (next.foil !== undefined && next.foil < 0) next.foil = 0;
          const entries = { ...state.entries };
          if (isEmpty(next)) delete entries[id];
          else entries[id] = next;
          return { entries };
        });
      };

      return {
        entries: {},
        hydrated: false,
        setHydrated: () => set({ hydrated: true }),

        patch: apply,
        setQty: (id, qty) => apply(id, { qty: Math.max(0, Math.floor(qty)) }),
        adjustQty: (id, delta) => {
          const cur = getState().entries[id]?.qty ?? 0;
          apply(id, { qty: Math.max(0, cur + delta) });
        },
        setFoil: (id, foil) => apply(id, { foil: Math.max(0, Math.floor(foil)) }),
        adjustFoil: (id, delta) => {
          const cur = getState().entries[id]?.foil ?? 0;
          apply(id, { foil: Math.max(0, cur + delta) });
        },
        toggleWant: (id) => apply(id, { want: !getState().entries[id]?.want }),
        setCondition: (id, condition) => apply(id, { condition }),
        setNotes: (id, notes) => apply(id, { notes }),
        acquire: (id) => {
          if ((getState().entries[id]?.qty ?? 0) <= 0) apply(id, { qty: 1, want: false });
        },
        remove: (id) =>
          set((state) => {
            const entries = { ...state.entries };
            delete entries[id];
            return { entries };
          }),

        replaceAll: (entries) => set({ entries: { ...entries } }),
        reset: () => set({ entries: {} }),
      };
    },
    {
      name: 'swccg-collection',
      version: 1,
      storage: createJSONStorage(() => idbStorage),
      partialize: (state) => ({ entries: state.entries }),
      onRehydrateStorage: () => (_state, error) => {
        // Flip `hydrated` on both success and failure (on error `state` is
        // undefined) so the app never waits on the splash fallback timer.
        if (error) console.error('Collection hydration failed:', error);
        useCollection.setState({ hydrated: true });
      },
    }
  )
);
