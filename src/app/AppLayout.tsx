import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { BottomNav } from '@/components/BottomNav';

export function AppLayout() {
  const { pathname } = useLocation();

  // Scroll to top on every route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <div className="pb-16">
        <Outlet />
      </div>
      <BottomNav />
    </>
  );
}
