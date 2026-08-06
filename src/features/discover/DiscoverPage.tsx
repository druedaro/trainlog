import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router';
import { RefreshCw, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import {
  fetchDiscoverArticles,
  fetchRecentEntries,
  saveDiscoverArticles,
  fetchSavedArticles,
  saveArticle,
  removeSavedArticle,
  markArticleAsRead,
} from '@/lib/firestore';
import { generateDiscover } from '@/lib/api';
import { ArticleView } from '@/features/discover/ArticleView';
import type { DiscoverArticle, DiscoverDocument } from '@/types/discover';

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

const CATEGORY_ORDER = ['training', 'recovery', 'mindset', 'nutrition'];

function sortArticles(articles: DiscoverArticle[]) {
  return [...articles].sort((a, b) => {
    return CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
  });
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  recovery: { label: 'Recuperación', color: 'text-emerald-400' },
  training: { label: 'Entrenamiento', color: 'text-blue-400' },
  mindset: { label: 'Mentalidad', color: 'text-purple-400' },
  nutrition: { label: 'Nutrición', color: 'text-orange-400' },
};

export function DiscoverPage() {
  const { user, profile } = useAuth();
  const location = useLocation();

  const [articles, setArticles] = useState<DiscoverArticle[]>([]);
  const [savedArticles, setSavedArticles] = useState<DiscoverArticle[]>([]);
  const [activeTab, setActiveTab] = useState<'explore' | 'saved'>('explore');
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<DiscoverArticle | null>(null);
  const [error, setError] = useState<string | null>(null);

  
  useEffect(() => {
    if (location.state?.navReset) {
      setSelectedArticle(null);
    }
  }, [location.state?.navReset]);

  const loadArticles = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const cached = await fetchDiscoverArticles(user.uid);
      if (cached && cached.articles.length > 0) {
        setArticles(sortArticles(cached.articles));
        setUpdatedAt(cached.updatedAt);

        
        const age = Date.now() - cached.updatedAt;
        if (age > THREE_DAYS_MS) {
          handleGenerate(true); 
        }
      }
    } catch (e) {
      console.error('Failed to load discover articles:', e);
      setError('Error al cargar los artículos.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const loadSavedArticles = useCallback(async () => {
    if (!user) return;
    setIsLoadingSaved(true);
    try {
      const saved = await fetchSavedArticles(user.uid);
      setSavedArticles(saved);
    } catch (e) {
      console.error('Failed to load saved articles:', e);
    } finally {
      setIsLoadingSaved(false);
    }
  }, [user]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (activeTab === 'saved') {
      loadSavedArticles();
    }
  }, [activeTab, loadSavedArticles]);

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

        const result = await generateDiscover(simplifiedEntries, profile);

        const discoverDoc: DiscoverDocument = {
          articles: result.articles as DiscoverArticle[],
          updatedAt: result.updatedAt,
        };

        await saveDiscoverArticles(user.uid, discoverDoc);

        setArticles(sortArticles(discoverDoc.articles));
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

  const handleToggleSave = useCallback(
    async (article: DiscoverArticle) => {
      if (!user) return;
      const isSaved = savedArticles.some((a) => a.id === article.id);

      
      if (isSaved) {
        setSavedArticles((prev) => prev.filter((a) => a.id !== article.id));
        try {
          await removeSavedArticle(user.uid, article.id);
        } catch (e) {
          console.error('Failed to remove saved article:', e);
          setSavedArticles((prev) => [...prev, article]); 
        }
      } else {
        setSavedArticles((prev) => [...prev, article]);
        try {
          await saveArticle(user.uid, article);
        } catch (e) {
          console.error('Failed to save article:', e);
          setSavedArticles((prev) => prev.filter((a) => a.id !== article.id)); 
        }
      }
    },
    [user, savedArticles],
  );

  const handleArticleClick = async (article: DiscoverArticle) => {
    setSelectedArticle(article);
    
    if (!article.isRead && activeTab === 'explore' && user) {
      
      setArticles(prev => prev.map(a => a.id === article.id ? { ...a, isRead: true } : a));
      await markArticleAsRead(user.uid, article.id).catch(console.error);
    }
  };

  if (selectedArticle) {
    const isSaved = savedArticles.some((a) => a.id === selectedArticle.id);
    return (
      <ArticleView
        article={selectedArticle}
        isSaved={isSaved}
        onToggleSave={() => handleToggleSave(selectedArticle)}
        onBack={() => setSelectedArticle(null)}
      />
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-background">
      <header className="glass sticky top-0 z-20 border-b border-border/40 px-5 pt-3.5 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-gradient">Discover</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (activeTab === 'explore') {
                handleGenerate(false);
              } else {
                loadSavedArticles();
              }
            }}
            disabled={isGenerating || isLoadingSaved}
            aria-label="Refresh"
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${(isGenerating || isLoadingSaved) ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
              activeTab === 'explore'
                ? 'bg-primary text-primary-foreground'
                : 'bg-primary/5 text-primary/70 hover:bg-primary/10'
            }`}
          >
            Explorar
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
              activeTab === 'saved'
                ? 'bg-primary text-primary-foreground'
                : 'bg-primary/5 text-primary/70 hover:bg-primary/10'
            }`}
          >
            Guardados
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 py-6">
        {error && (
          <div className="mb-5 animate-scale-in rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {((activeTab === 'explore' && isLoading) || (activeTab === 'saved' && isLoadingSaved)) && (
          <div className="flex flex-col items-center gap-5 pt-16 animate-fade-in">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary/30 border-t-primary" />
            <p className="text-sm text-muted-foreground">Cargando…</p>
          </div>
        )}

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

        {activeTab === 'explore' && !isLoading && !isGenerating && articles.length === 0 && (
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

        {activeTab === 'saved' && !isLoadingSaved && savedArticles.length === 0 && (
          <div className="flex flex-col items-center gap-6 pt-12 animate-fade-in text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <span className="text-3xl">🔖</span>
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Aún no has guardado nada</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Toca el icono de guardar en cualquier artículo para tenerlo a mano aquí.
              </p>
            </div>
          </div>
        )}

        {((activeTab === 'explore' && !isLoading && !isGenerating && articles.length > 0) ||
          (activeTab === 'saved' && !isLoadingSaved && savedArticles.length > 0)) && (
          <div className="space-y-4 animate-slide-up">
            {activeTab === 'explore' && updatedAt && (
              <p className="text-xs text-muted-foreground/60">
                Última actualización: {new Date(updatedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            )}

            {(activeTab === 'explore' ? articles : savedArticles).map((article) => {
              const catConfig = CATEGORY_CONFIG[article.category] ?? {
                label: article.category,
                color: 'text-muted-foreground',
              };

              return (
                <button
                  key={article.id}
                  onClick={() => handleArticleClick(article)}
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
                        {activeTab === 'explore' && (
                          <span className={`ml-auto text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                            article.isRead 
                              ? 'text-muted-foreground/60' 
                              : 'bg-primary/20 text-primary animate-pulse'
                          }`}>
                            {article.isRead ? '✓ Leído' : 'Nuevo'}
                          </span>
                        )}
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
