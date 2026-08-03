import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { DayPicker } from 'react-day-picker';
import { format, isSameDay } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { fetchEntriesByMonth } from '@/lib/firestore';
import type { JournalEntry } from '@/types/entry';
import 'react-day-picker/style.css';

export function CalendarView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const daysWithEntries = entries.map((entry) => entry.createdAt);

  const handleDayClick = (day: Date) => {
    const entriesForDay = entries.filter((entry) =>
      isSameDay(entry.createdAt, day),
    );

    if (entriesForDay.length === 1 && entriesForDay[0]) {
      navigate(`/entry/${entriesForDay[0].id}`);
    }
  };

  return (
    <div className="flex flex-col items-center animate-fade-in">
      {/* Calendar */}
      <div className="flex w-full justify-center rounded-2xl border border-border/40 bg-card/50 p-4 backdrop-blur-sm">
        <DayPicker
          mode="single"
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
        <p className="mt-5 text-sm text-muted-foreground">Loading entries…</p>
      )}

      {!isLoading && entries.length === 0 && (
        <p className="mt-5 text-center text-sm text-muted-foreground">
          No entries this month. Record your first reflection!
        </p>
      )}

      {!isLoading && entries.length > 0 && (
        <div className="mt-5 w-full space-y-2">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recent entries
          </h2>
          {entries.slice(0, 10).map((entry) => (
            <button
              key={entry.id}
              onClick={() => navigate(`/entry/${entry.id}`)}
              className="card-interactive flex w-full items-center gap-3 rounded-xl border border-border/40 bg-card/50 p-4 text-left backdrop-blur-sm"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">
                  {format(entry.createdAt, 'PPp')}
                </p>
                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-foreground">
                  {entry.analysis.summary}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {entry.analysis.themes.slice(0, 3).map((theme) => (
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
