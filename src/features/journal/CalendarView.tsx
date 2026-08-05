import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { DayPicker } from 'react-day-picker';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { fetchEntriesByMonth, fetchRecentEntries } from '@/lib/firestore';
import type { JournalEntry } from '@/types/entry';
import 'react-day-picker/style.css';

export function CalendarView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch month entries for calendar dots
  useEffect(() => {
    if (!user) return;
    const year = selectedMonth.getFullYear();
    const month = selectedMonth.getMonth() + 1;

    setIsLoading(true);
    fetchEntriesByMonth(user.uid, year, month)
      .then(setEntries)
      .catch((error) => {
        console.error('Failed to fetch entries:', error);
        setEntries([]);
      })
      .finally(() => setIsLoading(false));
  }, [user, selectedMonth]);

  // Fetch global recent entries (max 4)
  useEffect(() => {
    if (!user) return;
    fetchRecentEntries(user.uid, 4)
      .then(setRecentEntries)
      .catch(console.error);
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

  return (
    <div className="flex flex-col items-center animate-fade-in">
      <div className="flex w-full justify-center rounded-2xl border border-border/40 bg-card/50 p-4 backdrop-blur-sm">
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
      </div>

      {isLoading && (
        <p className="mt-5 text-sm text-muted-foreground">Cargando entradas…</p>
      )}

      {!isLoading && recentEntries.length === 0 && (
        <p className="mt-5 text-center text-sm text-muted-foreground">
          No hay entradas. ¡Graba tu primera reflexión!
        </p>
      )}

      {!isLoading && recentEntries.length > 0 && (
        <div className="mt-5 w-full space-y-2">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Entradas recientes
          </h2>
          {recentEntries.map((entry) => (
            <button
              key={entry.id}
              onClick={() => navigate(`/entry/${entry.id}`)}
              className="card-interactive flex w-full items-center gap-3 rounded-xl border border-border/40 bg-card/50 p-4 text-left backdrop-blur-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {format(entry.createdAt, "d 'de' MMMM, HH:mm", { locale: es })}
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
        </div>
      )}
    </div>
  );
}
