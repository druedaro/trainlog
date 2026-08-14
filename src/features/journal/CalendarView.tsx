import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { DayPicker } from 'react-day-picker';
import { format, isSameDay, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, ChevronUp } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { fetchEntriesByMonth } from '@/lib/firestore';
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


    </div>
  );
}
