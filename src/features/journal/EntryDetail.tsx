import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { format } from 'date-fns';
import { ArrowLeft, Zap, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import { fetchEntryById } from '@/lib/firestore';
import type { JournalEntry } from '@/types/entry';

const ENERGY_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  very_low: { label: 'Very low', color: 'text-red-400', emoji: '🔋' },
  low: { label: 'Low', color: 'text-orange-400', emoji: '🔋' },
  moderate: { label: 'Moderate', color: 'text-yellow-400', emoji: '⚡' },
  high: { label: 'High', color: 'text-emerald-400', emoji: '⚡' },
  very_high: { label: 'Very high', color: 'text-green-400', emoji: '🔥' },
};

const MOOD_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  very_negative: { label: 'Very negative', color: 'text-red-400', emoji: '😞' },
  negative: { label: 'Negative', color: 'text-orange-400', emoji: '😕' },
  neutral: { label: 'Neutral', color: 'text-yellow-400', emoji: '😐' },
  positive: { label: 'Positive', color: 'text-emerald-400', emoji: '😊' },
  very_positive: { label: 'Very positive', color: 'text-green-400', emoji: '😄' },
};

export function EntryDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user) return;

    setIsLoading(true);

    fetchEntryById(id, user.uid)
      .then((result) => {
        if (!result) {
          setErrorMessage('Entry not found.');
        }
        setEntry(result);
      })
      .catch(() => {
        setErrorMessage('Failed to load the entry. Please try again.');
      })
      .finally(() => setIsLoading(false));
  }, [id, user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (errorMessage || !entry) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6">
        <p className="text-muted-foreground">{errorMessage ?? 'Entry not found.'}</p>
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="gap-2 rounded-xl border-border/50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to journal
        </Button>
      </div>
    );
  }

  const { analysis } = entry;
  const energyInfo = analysis.perceivedEnergy ? ENERGY_CONFIG[analysis.perceivedEnergy] : null;
  const moodInfo = analysis.perceivedMood ? MOOD_CONFIG[analysis.perceivedMood] : null;

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background">
      {/* Header with gradient */}
      <div className="relative overflow-hidden border-b border-border/40 px-5 pb-6 pt-5">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="relative mb-4 gap-2 rounded-xl px-3 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="relative">
          <p className="text-sm font-medium text-muted-foreground">
            {format(entry.createdAt, 'PPPP')}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground/60">
            {format(entry.createdAt, 'p')}
          </p>
        </div>
      </div>

      <div className="space-y-4 px-5 py-6 animate-slide-up">
        {/* Summary */}
        <div className="rounded-2xl border border-border/40 bg-card/50 p-5 backdrop-blur-sm">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Summary
          </h3>
          <p className="text-sm leading-relaxed text-foreground">{analysis.summary}</p>
        </div>

        {/* Themes & Activities */}
        {(analysis.themes.length > 0 || analysis.activities.length > 0) && (
          <div className="rounded-2xl border border-border/40 bg-card/50 p-5 backdrop-blur-sm">
            {analysis.themes.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Themes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.themes.map((theme) => (
                    <span
                      key={theme}
                      className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysis.activities.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Activities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.activities.map((activity) => (
                    <span
                      key={activity}
                      className="rounded-full border border-border/50 bg-secondary/50 px-3 py-1.5 text-xs font-medium text-secondary-foreground"
                    >
                      {activity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Energy & Mood */}
        {(energyInfo || moodInfo) && (
          <div className="grid grid-cols-2 gap-3">
            {energyInfo && (
              <div className="rounded-2xl border border-border/40 bg-card/50 p-4 backdrop-blur-sm">
                <div className="mb-2 flex items-center gap-2">
                  <Zap className={`h-4 w-4 ${energyInfo.color}`} />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Energy
                  </h3>
                </div>
                <p className={`text-sm font-semibold ${energyInfo.color}`}>
                  {energyInfo.emoji} {energyInfo.label}
                </p>
              </div>
            )}
            {moodInfo && (
              <div className="rounded-2xl border border-border/40 bg-card/50 p-4 backdrop-blur-sm">
                <div className="mb-2 flex items-center gap-2">
                  <Smile className={`h-4 w-4 ${moodInfo.color}`} />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Mood
                  </h3>
                </div>
                <p className={`text-sm font-semibold ${moodInfo.color}`}>
                  {moodInfo.emoji} {moodInfo.label}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Reflection prompt */}
        {analysis.reflectionPrompt && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary/70">
              Something to reflect on
            </h3>
            <p className="text-sm italic leading-relaxed text-foreground/80">
              {analysis.reflectionPrompt}
            </p>
          </div>
        )}

        {/* Original transcript */}
        <div className="rounded-2xl border border-border/40 bg-card/50 p-5 backdrop-blur-sm">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Original transcript
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {entry.transcript}
          </p>
        </div>
      </div>
    </div>
  );
}
