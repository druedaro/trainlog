import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { DayPicker } from 'react-day-picker';
import { format, isSameDay } from 'date-fns';
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
    <div className="flex flex-col items-center py-4">
      <DayPicker
        mode="single"
        month={selectedMonth}
        onMonthChange={setSelectedMonth}
        onDayClick={handleDayClick}
        modifiers={{
          hasEntry: daysWithEntries,
        }}
        modifiersClassNames={{
          hasEntry: 'bg-primary/20 font-bold text-primary',
        }}
      />

      {isLoading && (
        <p className="mt-4 text-sm text-muted-foreground">Loading entries…</p>
      )}

      {!isLoading && entries.length === 0 && (
        <p className="mt-4 text-sm text-muted-foreground">
          No entries this month. Record your first reflection!
        </p>
      )}

      {!isLoading && entries.length > 0 && (
        <div className="mt-4 w-full max-w-sm space-y-2 px-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Recent entries
          </h2>
          {entries.slice(0, 10).map((entry) => (
            <button
              key={entry.id}
              onClick={() => navigate(`/entry/${entry.id}`)}
              className="w-full rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent"
            >
              <p className="text-xs text-muted-foreground">
                {format(entry.createdAt, 'PPp')}
              </p>
              <p className="mt-1 line-clamp-2 text-sm">
                {entry.analysis.summary}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {entry.analysis.themes.slice(0, 3).map((theme) => (
                  <span
                    key={theme}
                    className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
