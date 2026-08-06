import { createBrowserRouter } from 'react-router';
import { AuthGuard } from '@/features/auth/AuthGuard';
import { LoginPage } from '@/features/auth/LoginPage';
import { JournalPage } from '@/features/journal/JournalPage';
import { EntryDetail } from '@/features/journal/EntryDetail';
import { DayEntriesPage } from '@/features/journal/DayEntriesPage';
import { DiscoverPage } from '@/features/discover/DiscoverPage';
import { InsightsPage } from '@/features/insights/InsightsPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { CoachPage } from '@/features/coach/CoachPage';
import { AppLayout } from '@/app/AppLayout';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    Component: AuthGuard,
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
          },
          {
            path: '/insights',
            Component: InsightsPage,
          },
          {
            path: '/discover',
            Component: DiscoverPage,
          },
          {
            path: '/coach',
            Component: CoachPage,
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
