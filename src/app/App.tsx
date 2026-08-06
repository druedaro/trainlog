import { RouterProvider } from 'react-router';
import { AuthProvider } from '@/features/auth/useAuth';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { router } from '@/app/routes';

export function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}
