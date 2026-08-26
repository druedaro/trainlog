import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { fetchRecentEntries } from '@/lib/firestore';
import type { JournalEntry } from '@/types/entry';

export function RecentEntries() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    fetchRecentEntries(user.uid, 4)
      .then(setRecentEntries)
      .catch(() => toast.error('Error al cargar historial.'))
      .finally(() => setIsLoading(false));
  }, [user]);

  if (isLoading) {
    return (
      <div className="mt-5 w-full animate-pulse">
        <div className="mb-4 h-4 w-32 rounded bg-border/50"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-xl border border-border/40 bg-card/30 p-4">
              <div className="h-3 w-24 rounded bg-border/40 mb-3"></div>
              <div className="h-4 w-full rounded bg-border/30 mb-2"></div>
              <div className="h-4 w-3/4 rounded bg-border/30 mb-4"></div>
              <div className="flex gap-2">
                <div className="h-4 w-16 rounded-full bg-border/20"></div>
                <div className="h-4 w-16 rounded-full bg-border/20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recentEntries.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center animate-fade-in space-y-4 px-4 pb-8">
        <svg className="h-10 w-10 text-primary animate-bounce rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
        <div className="text-center rounded-2xl border border-primary/20 bg-primary/10 p-5 backdrop-blur-sm relative shadow-[0_0.08px_rgba(255,255,255,0.05)] w-full max-w-md mx-auto">
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-3xl">👋</div>
          <h2 className="mt-2 text-base font-bold text-foreground">¡Hola! Bienvenido a Trainlog</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">
            Toca el botón del micrófono arriba para registrar tu primer entrenamiento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 w-full animate-fade-in">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground pl-1">
        Entradas recientes
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {recentEntries.map((entry) => {
          // Color coding based on perceivedMood
          const moodColor = 
            entry.analysis.perceivedMood === 'very_positive' || entry.analysis.perceivedMood === 'positive' 
              ? 'text-green-500 bg-green-500/10'
              : entry.analysis.perceivedMood === 'very_negative' || entry.analysis.perceivedMood === 'negative'
              ? 'text-red-500 bg-red-500/10'
              : 'text-blue-500 bg-blue-500/10';

          return (
            <button
              key={entry.id}
              onClick={() => navigate(`/entry/${entry.id}`)}
              className="card-interactive flex h-full w-full flex-col gap-3 rounded-3xl shadow-sm border border-border/40 bg-card/50 p-5 text-left backdrop-blur-sm hover:shadow-[0_0.08px_hsl(var(--primary)/0.08)] transition-shadow"
            >
              <div className="flex w-full justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full shrink-0 ${moodColor.split(' ')[0]?.replace('text-', 'bg-')}`} />
                  <p className="text-xs font-medium text-muted-foreground">
                    {format(entry.createdAt, "d 'de' MMMM, HH:mm", { locale: es })}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              </div>
              <div className="min-w-0 flex-1 w-full">
                <p className="line-clamp-3 text-sm leading-relaxed text-foreground">
                  {entry.analysis.summary}
                </p>
                <div className="flex flex-wrap gap-1 mt-3">
                  {(entry.analysis.themes || []).slice(0, 3).map((theme) => (
                    <span
                      key={theme}
                      className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
