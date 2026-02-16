import { create } from 'zustand';

interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  role: 'admin' | 'broker' | 'company';
  companyId?: string;
  brokerId?: string;
  subscriptionPlan?: string;
}

interface UserStore {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  clearUser: () => void;
  hasRole: (role: string | string[]) => boolean;
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  clearUser: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }),

  hasRole: (role) => {
    const { user } = get();
    if (!user) return false;
    if (Array.isArray(role)) return role.includes(user.role);
    return user.role === role;
  },
}));
