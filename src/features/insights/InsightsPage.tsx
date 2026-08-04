import { useState, useEffect, useCallback, useMemo } from 'react';
import { Activity, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import {
  fetchEntriesByDays,
  fetchInsights,
  saveInsights,
} from '@/lib/firestore';
import { generateInsights } from '@/lib/api';
import type { JournalEntry } from '@/types/entry';
import type { InsightsDocument } from '@/types/insights';



// Helpers to map string values to numbers for simple bar charts
const ENERGY_VALUES: Record<string, number> = {
  very_low: 1,
  low: 2,
  moderate: 3,
  high: 4,
  very_high: 5,
};

const MOOD_VALUES: Record<string, number> = {
  very_negative: 1,
  negative: 2,
  neutral: 3,
  positive: 4,
  very_positive: 5,
};

export function InsightsPage() {
  const { user } = useAuth();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [insightsDoc, setInsightsDoc] = useState<InsightsDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      const [recentEntries, cachedInsights] = await Promise.all([
        fetchEntriesByDays(user.uid, 7), // Last 7 days
        fetchInsights(user.uid),
      ]);

      setEntries(recentEntries);
      if (cachedInsights) {
        setInsightsDoc(cachedInsights as InsightsDocument);
      }
    } catch (e) {
      console.error('Failed to load Insights data:', e);
      setError('Could not load your insights. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerateSynthesis = useCallback(async () => {
    if (!user) return;
    setIsGenerating(true);
    setError(null);

    try {
      if (entries.length === 0) {
        setError('Not enough data to generate a weekly synthesis.');
        setIsGenerating(false);
        return;
      }

      const simplifiedEntries = entries.map((e) => ({
        transcript: e.transcript,
        summary: e.analysis.summary,
        themes: e.analysis.themes || [],
        energy: e.analysis.perceivedEnergy,
        mood: e.analysis.perceivedMood,
        date: e.createdAt.toISOString(),
      }));

      const result = (await generateInsights(simplifiedEntries)) as InsightsDocument;
      
      await saveInsights(user.uid, result);
      setInsightsDoc(result);
    } catch (e) {
      console.error('Failed to generate synthesis:', e);
      setError('Failed to generate AI synthesis.');
    } finally {
      setIsGenerating(false);
    }
  }, [user, entries]);

  // Data processing for charts
  const stats = useMemo(() => {
    const themeCounts: Record<string, number> = {};
    let totalEnergy = 0;
    let energyCount = 0;
    let totalMood = 0;
    let moodCount = 0;

    entries.forEach((entry) => {
      // Themes
      entry.analysis.themes?.forEach((theme) => {
        const lower = theme.toLowerCase();
        themeCounts[lower] = (themeCounts[lower] || 0) + 1;
      });

      // Energy
      if (entry.analysis.perceivedEnergy && ENERGY_VALUES[entry.analysis.perceivedEnergy]) {
        totalEnergy += ENERGY_VALUES[entry.analysis.perceivedEnergy]!;
        energyCount++;
      }

      // Mood
      if (entry.analysis.perceivedMood && MOOD_VALUES[entry.analysis.perceivedMood]) {
        totalMood += MOOD_VALUES[entry.analysis.perceivedMood]!;
        moodCount++;
      }
    });

    // Sort themes by count
    const topThemes = Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      topThemes,
      avgEnergy: energyCount > 0 ? totalEnergy / energyCount : 0,
      avgMood: moodCount > 0 ? totalMood / moodCount : 0,
    };
  }, [entries]);

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-20 border-b border-border/40 px-5 py-3.5">
        <h1 className="text-lg font-bold text-gradient">Weekly Insights</h1>
      </header>

      <main className="flex-1 px-5 py-6 space-y-8 animate-slide-up pb-24">
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center gap-5 pt-16">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary/30 border-t-primary" />
            <p className="text-sm text-muted-foreground">Calculating patterns...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center gap-4 pt-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Activity className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">No data this week</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Record some journal entries to see your patterns.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Raw Stats Section */}
            <section className="space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                The Numbers (Last 7 Days)
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Energy Chart */}
                <div className="rounded-2xl border border-border/40 bg-card/50 p-4 backdrop-blur-sm">
                  <span className="text-xs font-semibold text-muted-foreground">Avg. Energy</span>
                  <div className="mt-3 flex h-24 items-end gap-1.5">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <div
                        key={val}
                        className={`w-full rounded-t-sm transition-all ${
                          val <= Math.round(stats.avgEnergy)
                            ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                            : 'bg-muted'
                        }`}
                        style={{ height: `${(val / 5) * 100}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Mood Chart */}
                <div className="rounded-2xl border border-border/40 bg-card/50 p-4 backdrop-blur-sm">
                  <span className="text-xs font-semibold text-muted-foreground">Avg. Mood</span>
                  <div className="mt-3 flex h-24 items-end gap-1.5">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <div
                        key={val}
                        className={`w-full rounded-t-sm transition-all ${
                          val <= Math.round(stats.avgMood)
                            ? 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.3)]'
                            : 'bg-muted'
                        }`}
                        style={{ height: `${(val / 5) * 100}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Themes Cloud */}
              {stats.topThemes.length > 0 && (
                <div className="rounded-2xl border border-border/40 bg-card/50 p-5 backdrop-blur-sm">
                  <span className="text-xs font-semibold text-muted-foreground">Top Themes</span>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {stats.topThemes.map(([theme, count]) => (
                      <div
                        key={theme}
                        className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5"
                      >
                        <span className="text-sm font-medium text-foreground capitalize">{theme}</span>
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* AI Synthesis Section */}
            <section className="space-y-4 pt-4 border-t border-border/30">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  AI Synthesis
                </h2>
                {insightsDoc && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateSynthesis}
                    disabled={isGenerating}
                    className="h-8 rounded-lg px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Refresh
                  </Button>
                )}
              </div>

              {!insightsDoc && !isGenerating && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
                  <Sparkles className="mx-auto mb-3 h-6 w-6 text-primary" />
                  <p className="mb-4 text-sm text-foreground/80">
                    Generate an AI analysis of how your training sessions connect this week.
                  </p>
                  <Button
                    onClick={handleGenerateSynthesis}
                    className="rounded-xl font-semibold w-full"
                  >
                    Analyze Week
                  </Button>
                </div>
              )}

              {isGenerating && (
                <div className="rounded-2xl border border-border/40 bg-card/50 p-6 text-center">
                  <div className="mx-auto mb-4 h-6 w-6 animate-spin rounded-full border-[2px] border-primary/30 border-t-primary" />
                  <p className="text-sm text-muted-foreground">Connecting the dots...</p>
                </div>
              )}

              {insightsDoc?.synthesis && !isGenerating && (
                <div className="space-y-4">
                  <div className="prose-trainlog rounded-2xl border border-primary/20 bg-primary/5 p-5 text-sm leading-relaxed text-foreground/90 backdrop-blur-sm">
                    {insightsDoc.synthesis.summary.split('\n').map((paragraph, i) => (
                      <p key={i} className="mb-3 last:mb-0">{paragraph}</p>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-border/40 bg-card/50 p-5 backdrop-blur-sm">
                    <h3 className="mb-4 text-xs font-semibold text-muted-foreground">Key Takeaways</h3>
                    <ul className="space-y-3">
                      {insightsDoc.synthesis.highlights.map((highlight, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <span className="text-sm leading-snug text-foreground/80">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
