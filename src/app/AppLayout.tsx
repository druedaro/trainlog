import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { BottomNav } from '@/components/BottomNav';
import { SideNav } from '@/components/SideNav';
import { Toaster } from 'sonner';
import { InstallPWA } from '@/components/InstallPWA';
import { setupMessageListener } from '@/lib/push';
import { requestPushPermissions } from '@/lib/push';
import { useAuth } from '@/features/auth/useAuth';

export function AppLayout() {
  const { pathname } = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
    setupMessageListener();

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && user) {
      requestPushPermissions(user.uid).catch(console.error);
    }
  }, [pathname, user]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-background">
      <SideNav />
      <div className="flex-1 pb-16 md:pb-0 md:pl-24 lg:pl-64 w-full">
        <Outlet />
      </div>
      <div className="md:hidden">
        <BottomNav />
      </div>
      <InstallPWA />
      <Toaster position="top-center" theme="dark" />
    </div>
  );
}
