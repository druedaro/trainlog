import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import {
  fetchDiscoverArticles,
  fetchRecentEntries,
  saveDiscoverArticles,
} from '@/lib/firestore';
import { generateDiscover } from '@/lib/api';
import { ArticleView } from '@/features/discover/ArticleView';
import type { DiscoverArticle, DiscoverDocument } from '@/types/discover';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  recovery: { label: 'Recuperación', color: 'text-emerald-400' },
  training: { label: 'Entrenamiento', color: 'text-blue-400' },
  mindset: { label: 'Mentalidad', color: 'text-purple-400' },
};

export function DiscoverPage() {
  const { user } = useAuth();

  const [articles, setArticles] = useState<DiscoverArticle[]>([]);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<DiscoverArticle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadArticles = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const cached = await fetchDiscoverArticles(user.uid);

      if (cached && cached.articles.length > 0) {
        setArticles(cached.articles);
        setUpdatedAt(cached.updatedAt);

        // Auto-update if older than 3 days
        const age = Date.now() - cached.updatedAt;
        if (age > THREE_DAYS_MS) {
          handleGenerate(true); // silent background refresh
        }
      }
    } catch (e) {
      console.error('Failed to load Discover articles:', e);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const handleGenerate = useCallback(
    async (silent = false) => {
      if (!user) return;

      if (!silent) {
        setIsGenerating(true);
        setError(null);
      }

      try {
        const recentEntries = await fetchRecentEntries(user.uid, 3);

        if (recentEntries.length === 0) {
          setError('Necesitas al menos una entrada para generar recomendaciones.');
          setIsGenerating(false);
          return;
        }

        const simplifiedEntries = recentEntries.map((e) => ({
          transcript: e.transcript,
          summary: e.analysis.summary,
          themes: e.analysis.themes || [],
          activities: e.analysis.activities,
          energy: e.analysis.perceivedEnergy,
          mood: e.analysis.perceivedMood,
          date: e.createdAt.toISOString(),
        }));

        const result = await generateDiscover(simplifiedEntries);

        const discoverDoc: DiscoverDocument = {
          articles: result.articles as DiscoverArticle[],
          updatedAt: result.updatedAt,
        };

        await saveDiscoverArticles(user.uid, discoverDoc);

        setArticles(discoverDoc.articles);
        setUpdatedAt(discoverDoc.updatedAt);
      } catch (e) {
        console.error('Failed to generate Discover articles:', e);
        if (!silent) {
          setError('Error al generar recomendaciones. Inténtalo de nuevo.');
        }
      } finally {
        setIsGenerating(false);
      }
    },
    [user],
  );

  // If user selects an article, show full view
  if (selectedArticle) {
    return (
      <ArticleView
        article={selectedArticle}
        onBack={() => setSelectedArticle(null)}
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-20 border-b border-border/40 px-5 py-3.5">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gradient">Discover</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleGenerate(false)}
            disabled={isGenerating}
            aria-label="Generate new recommendations"
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      <main className="flex-1 px-5 py-6">
        {/* Error */}
        {error && (
          <div className="mb-5 animate-scale-in rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex flex-col items-center gap-5 pt-16 animate-fade-in">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary/30 border-t-primary" />
            <p className="text-sm text-muted-foreground">Cargando recomendaciones…</p>
          </div>
        )}

        {/* Generating state */}
        {isGenerating && (
          <div className="flex flex-col items-center gap-5 pt-16 animate-fade-in">
            <div className="relative">
              <div className="h-16 w-16 animate-spin rounded-full border-[3px] border-primary/30 border-t-primary" />
              <Sparkles className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Analizando tu historial de entrenamiento…</p>
            <p className="text-xs text-muted-foreground/60">Esto puede tardar unos segundos</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isGenerating && articles.length === 0 && (
          <div className="flex flex-col items-center gap-6 pt-12 animate-fade-in">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-base font-semibold text-foreground">Aún no hay recomendaciones</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Genera artículos personalizados según tu historial de entrenamiento.
              </p>
            </div>
            <Button
              onClick={() => handleGenerate(false)}
              className="rounded-xl bg-primary px-6 py-5 font-semibold text-primary-foreground"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generar recomendaciones
            </Button>
          </div>
        )}

        {/* Articles list */}
        {!isLoading && !isGenerating && articles.length > 0 && (
          <div className="space-y-4 animate-slide-up">
            {/* Last updated */}
            {updatedAt && (
              <p className="text-xs text-muted-foreground/60">
                Última actualización: {new Date(updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}

            {articles.map((article) => {
              const catConfig = CATEGORY_CONFIG[article.category] ?? {
                label: article.category,
                color: 'text-muted-foreground',
              };

              return (
                <button
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="group w-full rounded-2xl border border-border/40 bg-card/50 p-5 text-left backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-primary/5 active:scale-[0.98]"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl">
                      {article.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${catConfig.color}`}>
                          {catConfig.label}
                        </span>
                      </div>
                      <h3 className="mt-1 text-sm font-semibold text-foreground line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                        {article.reason}
                      </p>
                    </div>
                    <ArrowLeft className="mt-1 h-4 w-4 shrink-0 rotate-180 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
