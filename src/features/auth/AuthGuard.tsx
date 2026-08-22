import { Navigate, Outlet } from 'react-router';
import { useAuth } from '@/features/auth/useAuth';
import { OnboardingModal } from '@/features/auth/OnboardingModal';
import { Skeleton } from '@/components/ui/skeleton';
import { SideNav } from '@/components/SideNav';
import { BottomNav } from '@/components/BottomNav';

export function HydrateFallback() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background">
      <SideNav />
      <div className="flex-1 pb-16 md:pb-0 md:pl-24 lg:pl-64 w-full">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col p-5 animate-pulse">
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
      </div>
      <div className="md:hidden">
        <BottomNav />
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
