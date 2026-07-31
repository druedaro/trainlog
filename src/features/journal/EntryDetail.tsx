import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/features/auth/useAuth';
import { fetchEntryById } from '@/lib/firestore';
import type { JournalEntry } from '@/types/entry';

const ENERGY_LABELS: Record<string, string> = {
  very_low: 'Very low',
  low: 'Low',
  moderate: 'Moderate',
  high: 'High',
  very_high: 'Very high',
};

const MOOD_LABELS: Record<string, string> = {
  very_negative: 'Very negative',
  negative: 'Negative',
  neutral: 'Neutral',
  positive: 'Positive',
  very_positive: 'Very positive',
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (errorMessage || !entry) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground">{errorMessage ?? 'Entry not found.'}</p>
        <Button variant="outline" onClick={() => navigate('/')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to journal
        </Button>
      </div>
    );
  }

  const { analysis } = entry;

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="mb-4 gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          {format(entry.createdAt, 'PPPP · p')}
        </p>
      </div>

      <div className="space-y-4">
        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{analysis.summary}</p>
          </CardContent>
        </Card>

        {/* Themes & Activities */}
        <Card>
          <CardContent className="pt-6">
            {analysis.themes.length > 0 && (
              <div className="mb-4">
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                  Themes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.themes.map((theme) => (
                    <span
                      key={theme}
                      className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysis.activities.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                  Activities
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.activities.map((activity) => (
                    <span
                      key={activity}
                      className="rounded-full border px-3 py-1 text-xs font-medium"
                    >
                      {activity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Energy & Mood */}
        {(analysis.perceivedEnergy || analysis.perceivedMood) && (
          <Card>
            <CardContent className="grid grid-cols-2 gap-4 pt-6">
              {analysis.perceivedEnergy && (
                <div>
                  <h3 className="mb-1 text-sm font-medium text-muted-foreground">
                    Energy
                  </h3>
                  <p className="text-sm font-medium">
                    {ENERGY_LABELS[analysis.perceivedEnergy] ??
                      analysis.perceivedEnergy}
                  </p>
                </div>
              )}
              {analysis.perceivedMood && (
                <div>
                  <h3 className="mb-1 text-sm font-medium text-muted-foreground">
                    Mood
                  </h3>
                  <p className="text-sm font-medium">
                    {MOOD_LABELS[analysis.perceivedMood] ??
                      analysis.perceivedMood}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Reflection prompt */}
        {analysis.reflectionPrompt && (
          <div className="rounded-lg bg-muted p-4">
            <h3 className="mb-1 text-sm font-medium text-muted-foreground">
              Something to reflect on
            </h3>
            <p className="text-sm italic leading-relaxed">
              {analysis.reflectionPrompt}
            </p>
          </div>
        )}

        {/* Original transcript */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Original transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {entry.transcript}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
