import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { BottomNav } from '@/components/BottomNav';
import { SideNav } from '@/components/SideNav';
import { Toaster } from 'sonner';
import { InstallPWA } from '@/components/InstallPWA';

export function AppLayout() {
  const { pathname } = useLocation();

  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

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
