import { useQuery } from '@tanstack/react-query';
import { 
  fetchUserProfile, 
  fetchRecentEntries, 
  fetchEntriesByDays,
  fetchDiscoverArticles,
  fetchExploreArticles,
  fetchSavedArticles,
  fetchInsights
} from '@/lib/firestore';
import { useAuth } from '@/features/auth/useAuth';

export function useProfileQuery(uid?: string) {
  const { user } = useAuth();
  const targetUid = uid || user?.uid;
  
  return useQuery({
    queryKey: ['profile', targetUid],
    queryFn: () => fetchUserProfile(targetUid!),
    enabled: !!targetUid,
  });
}

export function useRecentEntriesQuery(uid?: string, limitCount: number = 3) {
  const { user } = useAuth();
  const targetUid = uid || user?.uid;
  
  return useQuery({
    queryKey: ['entries', 'recent', targetUid, limitCount],
    queryFn: () => fetchRecentEntries(targetUid!, limitCount),
    enabled: !!targetUid,
  });
}

export function useEntriesByDaysQuery(uid?: string, days: number = 7) {
  const { user } = useAuth();
  const targetUid = uid || user?.uid;
  
  return useQuery({
    queryKey: ['entries', 'days', targetUid, days],
    queryFn: () => fetchEntriesByDays(targetUid!, days),
    enabled: !!targetUid,
  });
}

export function useDiscoverArticlesQuery(uid?: string) {
  const { user } = useAuth();
  const targetUid = uid || user?.uid;
  
  return useQuery({
    queryKey: ['discover', targetUid],
    queryFn: () => fetchDiscoverArticles(targetUid!),
    enabled: !!targetUid,
  });
}

export function useExploreArticlesQuery(uid?: string) {
  const { user } = useAuth();
  const targetUid = uid || user?.uid;
  
  return useQuery({
    queryKey: ['explore', targetUid],
    queryFn: () => fetchExploreArticles(targetUid!),
    enabled: !!targetUid,
  });
}

export function useSavedArticlesQuery(uid?: string) {
  const { user } = useAuth();
  const targetUid = uid || user?.uid;
  
  return useQuery({
    queryKey: ['savedArticles', targetUid],
    queryFn: async () => {
      const res = await fetchSavedArticles(targetUid!);
      return res.articles;
    },
    enabled: !!targetUid,
  });
}

import { countUserEntries } from '@/lib/firestore';

export function useEntriesCountQuery(uid?: string) {
  const { user } = useAuth();
  const targetUid = uid || user?.uid;
  
  return useQuery({
    queryKey: ['entriesCount', targetUid],
    queryFn: () => countUserEntries(targetUid!),
    enabled: !!targetUid,
  });
}

export function useInsightsQuery(uid?: string) {
  const { user } = useAuth();
  const targetUid = uid || user?.uid;
  
  return useQuery({
    queryKey: ['insights', targetUid],
    queryFn: () => fetchInsights(targetUid!),
    enabled: !!targetUid,
  });
}
