import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { DayPicker } from 'react-day-picker';
import { format, isSameDay, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { ChevronRight, Calendar as CalendarIcon, ChevronUp } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { fetchEntriesByMonth, fetchRecentEntries } from '@/lib/firestore';
import type { JournalEntry } from '@/types/entry';
import 'react-day-picker/style.css';

export function CalendarView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [showFullMonth, setShowFullMonth] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return false;
  });
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  
  useEffect(() => {
    if (!user) return;
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth() + 1;

    setIsLoading(true);
    fetchEntriesByMonth(user.uid, year, month)
      .then(setEntries)
      .catch(() => {
        toast.error('Error al cargar las entradas.');
        setEntries([]);
      })
      .finally(() => setIsLoading(false));
  }, [user, selectedMonth]);

  
  useEffect(() => {
    if (!user) return;
    fetchRecentEntries(user.uid, 6)
      .then(setRecentEntries)
      .catch(() => toast.error('Error al cargar historial.'));
  }, [user]);

  const daysWithEntries = entries.map((entry) => entry.createdAt);

  const handleDayClick = (day: Date) => {
    const entriesForDay = entries.filter((entry) =>
      isSameDay(entry.createdAt, day),
    );

    if (entriesForDay.length === 1 && entriesForDay[0]) {
      navigate(`/entry/${entriesForDay[0].id}`);
    } else if (entriesForDay.length > 1) {
      navigate(`/day/${format(day, 'yyyy-MM-dd')}`);
    }
  };

  const today = new Date();
  const last7Days = Array.from({ length: 7 }).map((_, i) => subDays(today, 6 - i));

  return (
    <div className="flex flex-col items-center animate-fade-in">
      {showFullMonth ? (
        <div className="flex flex-col w-full items-center rounded-2xl border border-border/40 bg-card/50 p-4 backdrop-blur-sm animate-fade-in">
          <DayPicker
            locale={es}
            month={selectedMonth}
            onMonthChange={setSelectedMonth}
            onDayClick={handleDayClick}
            modifiers={{
              hasEntry: daysWithEntries,
            }}
            modifiersClassNames={{
              hasEntry: 'day-has-entry font-bold',
            }}
          />
          <button
            onClick={() => setShowFullMonth(false)}
            className="mt-4 flex items-center justify-center w-full gap-2 rounded-xl bg-primary/10 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            <ChevronUp className="h-4 w-4" />
            Ocultar mes
          </button>
        </div>
      ) : (
        <div className="flex w-full flex-col items-center rounded-2xl border border-border/40 bg-card/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="flex w-full justify-between px-2 mb-2">
            {last7Days.map((day, i) => {
              const hasEntry = daysWithEntries.some(d => isSameDay(d, day));
              const isToday = isSameDay(day, today);
              return (
                <button
                  key={i}
                  onClick={() => handleDayClick(day)}
                  className={`flex flex-col items-center gap-1.5 p-1 transition-transform active:scale-95 ${hasEntry ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <span className="text-[10px] font-medium uppercase text-muted-foreground">
                    {format(day, 'EEEEEE', { locale: es })}
                  </span>
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ${isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="h-1 w-1 rounded-full">
                    {hasEntry && <div className="h-full w-full rounded-full bg-primary" />}
                  </div>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setShowFullMonth(true)}
            className="mt-2 flex items-center justify-center w-full gap-2 rounded-xl bg-primary/10 py-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            Ver mes completo
          </button>
        </div>
      )}

      {isLoading && (
        <p className="mt-5 text-sm text-muted-foreground">Cargando entradas…</p>
      )}

      {!isLoading && recentEntries.length === 0 && (
        <div className="mt-6 flex flex-col items-center justify-center animate-fade-in space-y-4 px-4 pb-8">
          <svg className="h-10 w-10 text-primary animate-bounce rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
          <div className="text-center rounded-2xl border border-primary/20 bg-primary/10 p-5 backdrop-blur-sm relative shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-3xl">👋</div>
            <h2 className="mt-2 text-base font-bold text-foreground">¡Hola! Bienvenido a Trainlog</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">
              Toca el botón del micrófono arriba para registrar tu primer entrenamiento.
            </p>
          </div>
        </div>
      )}

      {!isLoading && recentEntries.length > 0 && (
        <div className="mt-5 w-full">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Entradas recientes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentEntries.map((entry) => (
              <button
                key={entry.id}
                onClick={() => navigate(`/entry/${entry.id}`)}
                className="card-interactive flex h-full w-full flex-col gap-3 rounded-xl border border-border/40 bg-card/50 p-4 text-left backdrop-blur-sm"
              >
                <div className="flex w-full justify-between items-start">
                  <p className="text-xs font-medium text-muted-foreground">
                    {format(entry.createdAt, "d 'de' MMMM, HH:mm", { locale: es })}
                  </p>
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
