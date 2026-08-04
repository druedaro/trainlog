import { useLocation, useNavigate } from 'react-router';
import { BookOpen, Compass, Activity, User } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Journal', icon: BookOpen },
  { path: '/insights', label: 'Insights', icon: Activity },
  { path: '/discover', label: 'Discover', icon: Compass },
  { path: '/profile', label: 'Profile', icon: User },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show on entry detail pages or login
  const hiddenPaths = ['/login'];
  const isEntryDetail = location.pathname.startsWith('/entry/');
  if (hiddenPaths.includes(location.pathname) || isEntryDetail) {
    return null;
  }

  return (
    <nav className="glass fixed bottom-0 left-0 right-0 z-30 border-t border-border/40">
      <div className="mx-auto flex max-w-lg">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;

          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-1 flex-col items-center gap-1 py-3 transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'drop-shadow-[0_0_6px_hsl(var(--primary)/0.4)]' : ''}`} />
              <span className={`text-[10px] font-semibold tracking-wide ${isActive ? 'text-primary' : ''}`}>
                {label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 h-0.5 w-12 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
