import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import { fetchEntriesByDay } from '@/lib/firestore';
import type { JournalEntry } from '@/types/entry';

const PAGE_SIZE = 4;

export function DayEntriesPage() {
  const { date } = useParams<{ date: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (!date || !user) return;
    
    setIsLoading(true);
    fetchEntriesByDay(user.uid, date)
      .then(setEntries)
      .catch((error) => console.error('Failed to fetch day entries:', error))
      .finally(() => setIsLoading(false));
  }, [date, user]);

  const displayDate = date ? new Date(`${date}T12:00:00`) : new Date();
  const visibleEntries = entries.slice(0, visibleCount);
  const hasMore = visibleCount < entries.length;

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-background">
      <header className="glass sticky top-0 z-20 border-b border-border/40 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Volver"
            className="h-9 w-9 rounded-xl text-foreground hover:bg-foreground/10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-foreground">
              {format(displayDate, "d 'de' MMMM, yyyy", { locale: es })}
            </h1>
            <p className="text-xs text-muted-foreground">
              {entries.length} {entries.length === 1 ? 'entrada' : 'entradas'}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-5 pb-24 pt-6 animate-slide-up">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary/30 border-t-primary" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">No hay entradas para este día.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleEntries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => navigate(`/entry/${entry.id}`)}
                className="card-interactive flex w-full items-center gap-3 rounded-xl border border-border/40 bg-card/50 p-4 text-left backdrop-blur-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {format(entry.createdAt, 'HH:mm', { locale: es })}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-foreground">
                    {entry.analysis.summary}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2.5">
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
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              </button>
            ))}

            {hasMore && (
              <button
                onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/40 bg-card/50 py-3 text-sm font-medium text-primary backdrop-blur-sm transition-colors hover:bg-primary/5"
              >
                Ver más
                <ChevronDown className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
