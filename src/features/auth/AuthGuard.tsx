import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/features/auth/useAuth';
import { OnboardingModal } from '@/features/auth/OnboardingModal';
import { Skeleton } from '@/components/ui/skeleton';

export function HydrateFallback() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col bg-background p-5 animate-pulse">
      <div className="flex justify-between items-center mb-8">
        <Skeleton className="h-8 w-32 rounded-xl" />
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function AuthGuard() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <OnboardingModal />
      <Outlet />
    </>
  );
}
