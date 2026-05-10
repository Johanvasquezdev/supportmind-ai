import useSWR from 'swr';
import { useApi } from './use-api';

export function useAnalytics() {
  const api = useApi();

  const { data: overview, error: overviewError, isLoading: overviewLoading } = useSWR(
    'analytics/overview',
    () => api.get('analytics/overview').then(res => res.data),
    { refreshInterval: 30000 } // Refresh every 30s
  );

  const { data: usage, error: usageError, isLoading: usageLoading } = useSWR(
    'analytics/usage',
    () => api.get('analytics/usage').then(res => res.data),
    { refreshInterval: 60000 }
  );

  const { data: conversations, error: conversationsError, isLoading: conversationsLoading } = useSWR(
    'analytics/conversations',
    () => api.get('analytics/conversations').then(res => res.data),
    { refreshInterval: 30000 }
  );

  const { data: documents, error: documentsError, isLoading: documentsLoading } = useSWR(
    'analytics/documents',
    () => api.get('analytics/documents').then(res => res.data),
    { refreshInterval: 60000 }
  );

  const { data: health, error: healthError, isLoading: healthLoading } = useSWR(
    'analytics/health',
    () => api.get('analytics/health').then(res => res.data),
    { refreshInterval: 300000 } // Health updates less frequently
  );

  return {
    overview,
    usage,
    conversations,
    documents,
    health,
    isLoading: overviewLoading || usageLoading || conversationsLoading || documentsLoading || healthLoading,
    isError: overviewError || usageError || conversationsError || documentsError || healthError
  };
}
