import { create } from 'zustand';

interface UiState {
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  commandPaletteOpen: boolean;
  notificationsOpen: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;
  setNotificationsOpen: (open: boolean) => void;
  toggleNotifications: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  commandPaletteOpen: false,
  notificationsOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  setNotificationsOpen: (open) => set({ notificationsOpen: open }),
  toggleNotifications: () => set((state) => ({ notificationsOpen: !state.notificationsOpen })),
}));
