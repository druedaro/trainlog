import { X, Trophy, Flame, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface MonthlyReport {
  id: string;
  month: string;
  summary: string;
  totalEntries: number;
  maxStreak: number;
  topActivity: string;
  createdAt: number;
}

interface MonthlyReportModalProps {
  report: MonthlyReport | null;
  onClose: () => void;
}

export function MonthlyReportModal({ report, onClose }: MonthlyReportModalProps) {
  if (!report) return null;

  const monthName = new Date(report.month + '-02').toLocaleString('es', { month: 'long', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border/50 bg-card/80 shadow-2xl animate-scale-up">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 pointer-events-none" />
        
        <div className="relative p-6 sm:p-8 flex flex-col items-center text-center">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 mb-6">
            <Trophy className="h-10 w-10 text-primary-foreground" />
          </div>

          <h2 className="text-2xl font-black uppercase tracking-tight text-gradient mb-1">
            Resumen Mensual
          </h2>
          <p className="text-sm font-semibold text-muted-foreground capitalize mb-6">
            {monthName}
          </p>

          <div className="w-full grid grid-cols-2 gap-4 mb-6">
            <div className="flex flex-col items-center p-4 rounded-2xl bg-background/50 border border-border/40">
              <Activity className="h-6 w-6 text-emerald-400 mb-2" />
              <p className="text-2xl font-bold text-foreground">{report.totalEntries}</p>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Entrenos</p>
            </div>
            <div className="flex flex-col items-center p-4 rounded-2xl bg-background/50 border border-border/40">
              <Flame className="h-6 w-6 text-amber-400 mb-2" />
              <p className="text-2xl font-bold text-foreground">{report.maxStreak}</p>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Mejor Racha</p>
            </div>
          </div>

          <div className="w-full p-5 rounded-2xl bg-primary/10 border border-primary/20 mb-8">
            <p className="text-sm leading-relaxed text-foreground/90 font-medium italic">
              "{report.summary}"
            </p>
          </div>

          <Button 
            onClick={onClose}
            className="w-full rounded-2xl py-6 font-bold text-base shadow-lg shadow-primary/20"
          >
            ¡A por el siguiente mes!
          </Button>
        </div>
      </div>
    </div>
  );
}
