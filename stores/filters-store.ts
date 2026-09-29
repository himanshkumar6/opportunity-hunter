import { create } from 'zustand';

interface FiltersState {
  leadSearchQuery: string;
  jobSearchQuery: string;
  setLeadSearchQuery: (query: string) => void;
  setJobSearchQuery: (query: string) => void;
  resetFilters: () => void;
}

export const useFiltersStore = create<FiltersState>((set) => ({
  leadSearchQuery: '',
  jobSearchQuery: '',
  setLeadSearchQuery: (query) => set({ leadSearchQuery: query }),
  setJobSearchQuery: (query) => set({ jobSearchQuery: query }),
  resetFilters: () => set({ leadSearchQuery: '', jobSearchQuery: '' }),
}));
