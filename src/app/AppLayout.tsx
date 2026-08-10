import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { BottomNav } from '@/components/BottomNav';
import { Toaster } from 'sonner';

export function AppLayout() {
  const { pathname } = useLocation();

  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <div className="pb-16">
        <Outlet />
      </div>
      <BottomNav />
      <Toaster position="top-center" theme="dark" />
    </>
  );
}
