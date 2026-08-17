import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/features/auth/useAuth';

export function AuthGuard() {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile !== null && !profile?.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
