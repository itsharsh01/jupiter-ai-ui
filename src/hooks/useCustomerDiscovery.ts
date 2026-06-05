import { useCallback, useEffect, useState } from 'react';
import { fetchCustomerDiscovery, type CustomerDiscoveryStatus } from '../api/discovery';

const SESSION_KEY = 'jupiter_discovery_session_v2_id';

export function useCustomerDiscovery(customerId: string | null | undefined) {
  const [status, setStatus] = useState<CustomerDiscoveryStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!customerId) {
      setStatus(null);
      return null;
    }
    setLoading(true);
    try {
      const next = await fetchCustomerDiscovery(customerId);
      setStatus(next);
      if (next.session_id) {
        sessionStorage.setItem(SESSION_KEY, next.session_id);
      }
      return next;
    } catch {
      setStatus(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    status,
    loading,
    discoveryComplete: status?.discovery_complete ?? false,
    sessionId: status?.session_id ?? null,
    refresh,
  };
}
