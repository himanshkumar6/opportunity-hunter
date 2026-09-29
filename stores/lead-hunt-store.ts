import { create } from 'zustand';

export type SearchStep =
  | 'idle'
  | 'initiating'
  | 'preparing_search'
  | 'finding_businesses'
  | 'analyzing_opportunities'
  | 'saving_results'
  | 'completed'
  | 'error';

interface LeadHuntState {
  currentStep: SearchStep;
  statusMessage: string;
  activeSearchRunId: string | null;
  setSearchStep: (step: SearchStep, message?: string) => void;
  setActiveSearchRunId: (id: string | null) => void;
  resetSearchState: () => void;
}

export const useLeadHuntStore = create<LeadHuntState>((set) => ({
  currentStep: 'idle',
  statusMessage: '',
  activeSearchRunId: null,
  setSearchStep: (step, message) =>
    set({
      currentStep: step,
      statusMessage: message || getDefaultMessage(step),
    }),
  setActiveSearchRunId: (id) => set({ activeSearchRunId: id }),
  resetSearchState: () =>
    set({
      currentStep: 'idle',
      statusMessage: '',
      activeSearchRunId: null,
    }),
}));

function getDefaultMessage(step: SearchStep): string {
  switch (step) {
    case 'initiating':
      return 'Initiating search request...';
    case 'preparing_search':
      return 'Preparing search parameters...';
    case 'finding_businesses':
      return 'Finding local businesses...';
    case 'analyzing_opportunities':
      return 'Analyzing digital opportunities & scoring...';
    case 'saving_results':
      return 'Saving results to pipeline...';
    case 'completed':
      return 'Search run completed successfully!';
    case 'error':
      return 'Search encountered an issue.';
    default:
      return '';
  }
}
