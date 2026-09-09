import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUiStore = create(
  persist(
    (set) => ({
      branches: [],
      selectedBranchId: null,
      setBranches: (branches) => set({ branches }),
      setSelectedBranchId: (id) => set({ selectedBranchId: id }),
    }),
    { name: 'oism-ui' },
  ),
);
