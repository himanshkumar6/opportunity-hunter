import { create } from 'zustand';

interface DashboardState {
  timeframe: '7d' | '30d' | '90d' | 'all';
  activeTab: 'all' | 'jobs' | 'leads';
  setTimeframe: (timeframe: '7d' | '30d' | '90d' | 'all') => void;
  setActiveTab: (tab: 'all' | 'jobs' | 'leads') => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  timeframe: '30d',
  activeTab: 'all',
  setTimeframe: (timeframe) => set({ timeframe }),
  setActiveTab: (activeTab) => set({ activeTab }),
}));
