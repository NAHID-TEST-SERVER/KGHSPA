import { create } from 'zustand';
import { Match, Team, Commentary, Notification } from './types';

interface StoreState {
  matches: Match[];
  teams: Team[];
  commentary: Record<string, Commentary[]>;
  notifications: Notification[];
  unreadIds: Set<string>;
  setMatches: (matches: Match[]) => void;
  setTeams: (teams: Team[]) => void;
  setCommentary: (matchId: string, comments: Commentary[]) => void;
  setNotifications: (notifications: Notification[]) => void;
  addUnreadId: (id: string) => void;
  clearUnreadIds: () => void;
}

export const useStore = create<StoreState>((set) => ({
  matches: [],
  teams: [],
  commentary: {},
  notifications: [],
  unreadIds: new Set(),
  setMatches: (matches) => set({ matches }),
  setTeams: (teams) => set({ teams }),
  setCommentary: (matchId, comments) => 
    set((state) => ({ 
      commentary: { ...state.commentary, [matchId]: comments } 
    })),
  setNotifications: (notifications) => set({ notifications }),
  addUnreadId: (id) => set((state) => ({ unreadIds: new Set(state.unreadIds).add(id) })),
  clearUnreadIds: () => set({ unreadIds: new Set() })
}));

export interface Toast {
  id: string;
  message: string;
  title?: string;
  type?: 'success' | 'info' | 'error' | 'goal';
}

interface UiState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 5000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

interface AuthState {
  isAdmin: boolean;
  isLoading: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAdmin: false,
  isLoading: true,
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  setIsLoading: (isLoading) => set({ isLoading }),
}));
