import { useState, useEffect, useCallback, useMemo } from 'react';
import { Activity, Sparkles, AlertCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth/useAuth';
import { useProfileQuery } from '@/hooks/useQueries';
import {
  fetchEntriesByDays,
  fetchInsights,
  saveInsights,
} from '@/lib/firestore';
import { generateInsights } from '@/lib/api';
import type { JournalEntry } from '@/types/entry';
import type { InsightsDocument } from '@/types/insights';



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
  const { data: profile } = useProfileQuery();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [insightsDoc, setInsightsDoc] = useState<InsightsDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFullSynthesis, setShowFullSynthesis] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      const [recentEntries, cachedInsights] = await Promise.all([
        fetchEntriesByDays(user.uid, 7), 
        fetchInsights(user.uid),
      ]);

      setEntries(recentEntries);
      if (cachedInsights) {
        setInsightsDoc(cachedInsights as InsightsDocument);
      }
    } catch (e) {
      toast.error('No se pudieron cargar los insights.');
      setError('No se pudieron cargar los insights. Inténtalo de nuevo.');
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
        setError('No hay suficientes datos para generar una síntesis semanal.');
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

      const result = (await generateInsights(simplifiedEntries, profile)) as InsightsDocument;
      
      await saveInsights(user.uid, result);
      setInsightsDoc(result);
    } catch (e) {
      toast.error('Error al generar la síntesis.');
      setError('Error al generar la síntesis de IA.');
    } finally {
      setIsGenerating(false);
    }
  }, [user, profile, entries]);

  const stats = useMemo(() => {
    const themeCounts: Record<string, number> = {};
    let totalEnergy = 0;
    let energyCount = 0;
    let totalMood = 0;
    let moodCount = 0;

    entries.forEach((entry) => {
      entry.analysis.themes?.forEach((theme) => {
        const lower = theme.toLowerCase();
        themeCounts[lower] = (themeCounts[lower] || 0) + 1;
      });

      if (entry.analysis.perceivedEnergy && ENERGY_VALUES[entry.analysis.perceivedEnergy]) {
        totalEnergy += ENERGY_VALUES[entry.analysis.perceivedEnergy]!;
        energyCount++;
      }

      if (entry.analysis.perceivedMood && MOOD_VALUES[entry.analysis.perceivedMood]) {
        totalMood += MOOD_VALUES[entry.analysis.perceivedMood]!;
        moodCount++;
      }
    });

    
    const topThemes = Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      topThemes,
      avgEnergy: energyCount > 0 ? totalEnergy / energyCount : 0,
      avgMood: moodCount > 0 ? totalMood / moodCount : 0,
    };
  }, [entries]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [showFullSynthesis]);

  if (showFullSynthesis && insightsDoc?.synthesis) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col bg-background">
        <header className="glass sticky top-0 z-20 flex items-center gap-3 border-b border-border/40 px-5 py-3.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowFullSynthesis(false)}
            className="h-9 w-9 rounded-xl border border-border/50 bg-background hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-sm font-semibold text-foreground">Resumen de la semana</h1>
        </header>

        <main className="flex-1 space-y-6 p-5">
          <div className="prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-headings:font-semibold prose-strong:text-primary max-w-none text-foreground/90">
            <ReactMarkdown
              components={{
                strong: ({node, ...props}) => <strong className="font-bold text-primary underline decoration-primary/40 decoration-2 underline-offset-2" {...props} />,
                em: ({node, ...props}) => <em className="italic text-foreground/80" {...props} />,
                h1: ({node, ...props}) => <h3 className="text-lg font-bold mt-4 mb-2 text-foreground" {...props} />,
                h2: ({node, ...props}) => <h4 className="text-base font-bold mt-3 mb-2 text-foreground" {...props} />,
                h3: ({node, ...props}) => <h5 className="text-sm font-bold mt-2 mb-1 text-foreground" {...props} />,
                p: ({node, ...props}) => <p className="mb-4 leading-relaxed last:mb-0" {...props} />
              }}
            >
              {insightsDoc.synthesis.summary.replace(/##/g, '\n\n##').replace(/\*\*\s*(.*?)\s*\*\*/g, '**$1**')}
            </ReactMarkdown>
          </div>

          <div className="rounded-2xl border border-border/40 bg-card/50 p-5 mt-6">
            <h3 className="mb-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Puntos clave</h3>
            <ul className="space-y-4">
              {insightsDoc.synthesis.highlights.map((highlight, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="text-sm leading-snug text-foreground/80">
                    <ReactMarkdown
                      components={{
                        strong: ({node, ...props}) => <strong className="font-bold text-primary" {...props} />,
                        p: ({node, ...props}) => <span {...props} />
                      }}
                    >
                      {highlight.replace(/\*\*\s*(.*?)\s*\*\*/g, '**$1**')}
                    </ReactMarkdown>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col bg-background">
      <header className="glass sticky top-0 z-20 border-b border-border/40 px-5 py-3.5">
        <h1 className="text-lg font-extrabold text-gradient tracking-tight">Resumen semanal</h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground/80">
          Evolución y patrones analizados por IA
        </p>
      </header>

      <main className="flex-1 px-5 py-6 space-y-8 animate-slide-up pb-24">
        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <div className="flex flex-col gap-4">
              <Skeleton className="h-48 w-full rounded-2xl" />
              <Skeleton className="h-24 w-full rounded-2xl" />
            </div>
            <div className="flex flex-col gap-4">
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center gap-4 pt-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Activity className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Sin datos esta semana</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Graba algunas entradas para ver tus patrones.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <section className="space-y-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Los números (últimos 7 días)
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border/40 bg-card/50 p-4 backdrop-blur-sm">
                  <span className="text-xs font-semibold text-muted-foreground">Energía media</span>
                  <div className="mt-3 flex h-24 md:h-48 items-end justify-center gap-1.5 md:gap-3">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <div
                        key={val}
                        className={`w-full max-w-[32px] rounded-t-sm transition-all ${
                          val <= Math.round(stats.avgEnergy)
                            ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.3)]'
                            : 'bg-muted'
                        }`}
                        style={{ height: `${(val / 5) * 100}%` }}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-border/40 bg-card/50 p-4 backdrop-blur-sm">
                  <span className="text-xs font-semibold text-muted-foreground">Ánimo medio</span>
                  <div className="mt-3 flex h-24 md:h-48 items-end justify-center gap-1.5 md:gap-3">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <div
                        key={val}
                        className={`w-full max-w-[32px] rounded-t-sm transition-all ${
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

              {stats.topThemes.length > 0 && (
                <div className="rounded-2xl border border-border/40 bg-card/50 p-5 backdrop-blur-sm">
                  <span className="text-xs font-semibold text-muted-foreground">Temas principales</span>
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

            <section className="space-y-4 pt-4 md:pt-0 border-t md:border-t-0 border-border/30">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  Síntesis IA
                </h2>
                {insightsDoc && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateSynthesis}
                    disabled={isGenerating}
                    className="h-8 rounded-lg px-3 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground active:scale-95 transition-all"
                  >
                    Actualizar
                  </Button>
                )}
              </div>

              {!insightsDoc && !isGenerating && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
                  <Sparkles className="mx-auto mb-3 h-6 w-6 text-primary" />
                  <p className="mb-4 text-sm text-foreground/80">
                    Genera un análisis de IA sobre cómo se conectan tus entrenamientos esta semana.
                  </p>
                  <Button
                    onClick={handleGenerateSynthesis}
                    className="rounded-xl font-semibold w-full"
                  >
                    Analizar semana
                  </Button>
                </div>
              )}

              {isGenerating ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Skeleton className="mx-auto mb-4 h-6 w-1/3 rounded-full" />
                    <Skeleton className="mx-auto h-4 w-2/3 rounded-full" />
                  </div>
                ) : insightsDoc?.synthesis ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-sm leading-relaxed text-foreground/90 backdrop-blur-sm cursor-pointer md:cursor-auto hover:bg-primary/10 transition-colors"
                       onClick={() => window.innerWidth < 768 && setShowFullSynthesis(true)}>
                    <div className="line-clamp-3 md:line-clamp-none mb-2 md:mb-0 prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown
                        components={{
                          strong: ({node, ...props}) => <strong className="font-bold text-primary underline decoration-primary/40 decoration-2 underline-offset-2" {...props} />,
                          em: ({node, ...props}) => <em className="italic text-foreground/80" {...props} />,
                          h1: ({node, ...props}) => <h3 className="text-lg font-bold mt-4 mb-2 text-foreground" {...props} />,
                          h2: ({node, ...props}) => <h4 className="text-base font-bold mt-3 mb-2 text-foreground" {...props} />,
                          h3: ({node, ...props}) => <h5 className="text-sm font-bold mt-2 mb-1 text-foreground" {...props} />,
                          p: ({node, ...props}) => <p className="mb-3 leading-relaxed last:mb-0" {...props} />
                        }}
                      >
                        {insightsDoc.synthesis.summary.replace(/##/g, '\n\n##').replace(/\*\*\s*(.*?)\s*\*\*/g, '**$1**')}
                      </ReactMarkdown>
                    </div>
                    <span className="text-xs font-semibold text-primary md:hidden">Leer resumen completo...</span>
                  </div>

                  <div className="rounded-2xl border border-border/40 bg-card/50 p-5 backdrop-blur-sm">
                    <h3 className="mb-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Puntos clave</h3>
                    <ul className="space-y-3">
                      {insightsDoc.synthesis.highlights.map((highlight, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <span className="text-sm leading-snug text-foreground/80">
                            <ReactMarkdown
                              components={{
                                strong: ({node, ...props}) => <strong className="font-bold text-primary" {...props} />,
                                p: ({node, ...props}) => <span {...props} />
                              }}
                            >
                              {highlight.replace(/\*\*\s*(.*?)\s*\*\*/g, '**$1**')}
                            </ReactMarkdown>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
