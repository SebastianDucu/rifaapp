import { create } from 'zustand';
import type { User, Raffle, Ticket } from '@/types';
import { authApi } from '@/services/api';

// ============================================
// Auth Store
// ============================================

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const user = await authApi.login({ email, password });
      set({ user, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  register: async (email, password, name) => {
    set({ loading: true });
    try {
      const user = await authApi.register({ email, password, name });
      set({ user, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: async () => {
    await authApi.logout();
    set({ user: null });
  },

  checkAuth: async () => {
    try {
      const user = await authApi.getMe();
      set({ user, initialized: true });
    } catch {
      set({ user: null, initialized: true });
    }
  },
}));

// ============================================
// UI Store (tema, sidebar, etc.)
// ============================================

interface UIState {
  darkMode: boolean;
  sidebarOpen: boolean;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  darkMode: localStorage.getItem('darkMode') === 'true',
  sidebarOpen: false,

  toggleDarkMode: () =>
    set((state) => {
      const newValue = !state.darkMode;
      localStorage.setItem('darkMode', String(newValue));
      if (newValue) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { darkMode: newValue };
    }),

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));

// ============================================
// Raffle Selection Store
// ============================================

interface TicketSelectionState {
  selectedTickets: Set<string>;
  toggleTicket: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
}

export const useTicketSelectionStore = create<TicketSelectionState>((set, get) => ({
  selectedTickets: new Set(),

  toggleTicket: (id) =>
    set((state) => {
      const newSet = new Set(state.selectedTickets);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return { selectedTickets: newSet };
    }),

  selectAll: (ids) => set({ selectedTickets: new Set(ids) }),

  clearSelection: () => set({ selectedTickets: new Set() }),

  isSelected: (id) => get().selectedTickets.has(id),
}));

