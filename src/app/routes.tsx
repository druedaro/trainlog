import { createBrowserRouter } from 'react-router';
import { AuthGuard } from '@/features/auth/AuthGuard';
import { LoginPage } from '@/features/auth/LoginPage';
import { JournalPage } from '@/features/journal/JournalPage';
import { EntryDetail } from '@/features/journal/EntryDetail';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    Component: AuthGuard,
    children: [
      {
        path: '/',
        Component: JournalPage,
      },
      {
        path: '/entry/:id',
        Component: EntryDetail,
      },
    ],
  },
]);
