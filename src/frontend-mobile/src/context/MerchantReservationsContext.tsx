import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { merchantAPI } from '../services/api';
import { useAuth } from './AuthContext';

interface MerchantReservationsContextValue {
  pendingCount: number;
  refreshPendingCount: () => Promise<number>;
}

const MerchantReservationsContext = createContext<MerchantReservationsContextValue>({
  pendingCount: 0,
  refreshPendingCount: async () => 0,
});

export function MerchantReservationsProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  const refreshPendingCount = useCallback(async () => {
    if (!isAuthenticated || user?.role !== 'MERCHANT') {
      setPendingCount(0);
      return 0;
    }

    try {
      const response = await merchantAPI.listBookings({ status: 'PENDING', scope: 'upcoming', limit: 1 });
      const nextCount = response.counts?.PENDING ?? 0;
      setPendingCount(nextCount);
      return nextCount;
    } catch {
      setPendingCount(0);
      return 0;
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    void refreshPendingCount();
  }, [refreshPendingCount]);

  const value = useMemo(
    () => ({ pendingCount, refreshPendingCount }),
    [pendingCount, refreshPendingCount],
  );

  return <MerchantReservationsContext.Provider value={value}>{children}</MerchantReservationsContext.Provider>;
}

export function useMerchantReservations() {
  return useContext(MerchantReservationsContext);
}
