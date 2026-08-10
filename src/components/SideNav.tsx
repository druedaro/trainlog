import { useLocation, useNavigate } from 'react-router';
import { BookOpen, Compass, Activity, User, Bot, Dumbbell } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Journal', icon: BookOpen },
  { path: '/insights', label: 'Insights', icon: Activity },
  { path: '/coach', label: 'Coach', icon: Bot },
  { path: '/discover', label: 'Discover', icon: Compass },
  { path: '/profile', label: 'Perfil', icon: User },
];

export function SideNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const hiddenPrefixes = ['/login'];
  if (hiddenPrefixes.some((p) => location.pathname.startsWith(p))) {
    return null;
  }

  const handleNavClick = (path: string) => {
    navigate(path, { state: { navReset: Date.now() } });
  };

  return (
    <nav className="glass fixed left-0 top-0 bottom-0 z-40 hidden w-24 flex-col items-center border-r border-border/40 py-8 md:flex bg-background/80 backdrop-blur-xl">
      <div className="mb-12 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-[0_0_15px_hsl(var(--primary)/0.2)]">
        <Dumbbell className="h-6 w-6" />
      </div>

      <div className="flex w-full flex-col gap-8">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const isActive =
            path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(path);

          return (
            <button
              key={path}
              onClick={() => handleNavClick(path)}
              className={`group relative flex w-full flex-col items-center gap-2 py-2 transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon className={`h-6 w-6 transition-transform group-active:scale-95 ${isActive ? 'drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)] scale-110' : 'group-hover:scale-110'}`} />
              </div>
              <span className={`text-[11px] font-semibold tracking-wide ${isActive ? 'text-primary' : ''}`}>
                {label}
              </span>
              
              {isActive && (
                <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
