import { createBrowserRouter } from 'react-router';
import { AuthGuard } from '@/features/auth/AuthGuard';
import { LoginPage } from '@/features/auth/LoginPage';
import { JournalPage } from '@/features/journal/JournalPage';
import { EntryDetail } from '@/features/journal/EntryDetail';
import { DiscoverPage } from '@/features/discover/DiscoverPage';
import { InsightsPage } from '@/features/insights/InsightsPage';
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
            path: '/insights',
            Component: InsightsPage,
          },
          {
            path: '/discover',
            Component: DiscoverPage,
          },
          {
            path: '/entry/:id',
            Component: EntryDetail,
          },
        ],
      },
    ],
  },
]);
