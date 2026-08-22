import { createBrowserRouter, redirect } from 'react-router';
import { AuthGuard, HydrateFallback } from '@/features/auth/AuthGuard';
import { LoginPage } from '@/features/auth/LoginPage';
import { JournalPage } from '@/features/journal/JournalPage';
import { EntryDetail } from '@/features/journal/EntryDetail';
import { DayEntriesPage } from '@/features/journal/DayEntriesPage';
import { DiscoverPage } from '@/features/discover/DiscoverPage';
import { InsightsPage } from '@/features/insights/InsightsPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { CoachPage } from '@/features/coach/CoachPage';
import { PrivacyPage } from '@/features/legal/PrivacyPage';
import { TermsPage } from '@/features/legal/TermsPage';
import { AppLayout } from '@/app/AppLayout';
import { queryClient } from '@/lib/queryClient';
import { requireAuth } from '@/lib/authPromise';
import { 
  fetchUserProfile, 
  fetchRecentEntries, 
  fetchEntriesByDays, 
  fetchDiscoverArticles, 
  fetchInsights 
} from '@/lib/firestore';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    path: '/privacy',
    Component: PrivacyPage,
  },
  {
    path: '/terms',
    Component: TermsPage,
  },
  {
    Component: AuthGuard,
    HydrateFallback,
    loader: async () => {
      // Global auth check for protected routes
      const user = await requireAuth();
      if (!user) {
        return redirect('/login');
      }
      
      // Prefetch profile so it's ready across the app
      await queryClient.ensureQueryData({
        queryKey: ['profile', user.uid],
        queryFn: () => fetchUserProfile(user.uid)
      });
      
      return { user };
    },
    children: [
      {
        Component: AppLayout,
        children: [
          {
            path: '/',
            Component: JournalPage,
          },
          {
            path: '/profile',
            Component: ProfilePage,
            loader: async () => {
              const user = await requireAuth();
              if (user) {
                queryClient.prefetchQuery({
                  queryKey: ['entries', 'recent', user.uid, 100],
                  queryFn: () => fetchRecentEntries(user.uid, 100)
                });
              }
              return null;
            }
          },
          {
            path: '/insights',
            Component: InsightsPage,
            loader: async () => {
              const user = await requireAuth();
              if (user) {
                queryClient.prefetchQuery({
                  queryKey: ['entries', 'days', user.uid, 7],
                  queryFn: () => fetchEntriesByDays(user.uid, 7)
                });
                queryClient.prefetchQuery({
                  queryKey: ['insights', user.uid],
                  queryFn: () => fetchInsights(user.uid)
                });
              }
              return null;
            }
          },
          {
            path: '/discover',
            Component: DiscoverPage,
            loader: async () => {
              const user = await requireAuth();
              if (user) {
                queryClient.prefetchQuery({
                  queryKey: ['discover', user.uid],
                  queryFn: () => fetchDiscoverArticles(user.uid)
                });
              }
              return null;
            }
          },
          {
            path: '/coach',
            Component: CoachPage,
            loader: async () => {
              const user = await requireAuth();
              if (user) {
                queryClient.prefetchQuery({
                  queryKey: ['entries', 'days', user.uid, 90],
                  queryFn: () => fetchEntriesByDays(user.uid, 90)
                });
              }
              return null;
            }
          },
          {
            path: '/entry/:id',
            Component: EntryDetail,
          },
          {
            path: '/day/:date',
            Component: DayEntriesPage,
          },
        ],
      },
    ],
  },
]);
