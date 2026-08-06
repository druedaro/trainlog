import { Link } from 'react-router';
import { Activity } from 'lucide-react';

export function HeaderLogo() {
  return (
    <Link 
      to="/" 
      className="flex items-center gap-2 transition-opacity hover:opacity-80 focus-visible:opacity-80 outline-none rounded-md"
      aria-label="Ir al inicio"
    >
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Activity className="h-4 w-4" />
      </div>
      <span className="font-bold tracking-tight text-foreground">Trainlog</span>
    </Link>
  );
}
