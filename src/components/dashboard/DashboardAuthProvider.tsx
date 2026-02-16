'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';

type UserRole = 'admin' | 'company' | 'broker';

interface DashboardAuthContextValue {
  user: User;
  role: UserRole;
  companyId: string | null;
  brokerId: string | null;
}

const DashboardAuthContext = createContext<DashboardAuthContextValue | null>(null);

export function DashboardAuthProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: DashboardAuthContextValue;
}) {
  return (
    <DashboardAuthContext.Provider value={value}>
      {children}
    </DashboardAuthContext.Provider>
  );
}

export function useDashboardAuth(): DashboardAuthContextValue | null {
  return useContext(DashboardAuthContext);
}
