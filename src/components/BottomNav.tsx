import { useLocation, useNavigate } from 'react-router';
import { BookOpen, Compass, Activity, User } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Journal', icon: BookOpen },
  { path: '/insights', label: 'Insights', icon: Activity },
  { path: '/discover', label: 'Discover', icon: Compass },
  { path: '/profile', label: 'Perfil', icon: User },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show on login
  const hiddenPrefixes = ['/login'];
  if (hiddenPrefixes.some((p) => location.pathname.startsWith(p))) {
    return null;
  }

  const handleNavClick = (path: string) => {
    // Always navigate with a fresh state timestamp so the target page
    // can detect "user tapped the tab" and reset its internal state.
    navigate(path, { state: { navReset: Date.now() } });
  };

  return (
    <nav className="glass fixed bottom-0 left-0 right-0 z-30 border-t border-border/40">
      <div className="mx-auto flex max-w-lg">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isActive =
            path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path);

          return (
            <button
              key={path}
              onClick={() => handleNavClick(path)}
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
