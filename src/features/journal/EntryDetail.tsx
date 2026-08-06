import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { format } from 'date-fns';
import { ArrowLeft, Zap, Smile, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import {
  fetchEntryById,
  fetchRecentEntries,
  updateEntryContextualResponse,
  deleteEntry,
} from '@/lib/firestore';
import { generateContextualResponse } from '@/lib/api';
import type { JournalEntry } from '@/types/entry';
import ReactMarkdown from 'react-markdown';

const ENERGY_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  very_low: { label: 'Muy baja', color: 'text-red-400', emoji: '🔋' },
  low: { label: 'Baja', color: 'text-orange-400', emoji: '🔋' },
  moderate: { label: 'Moderada', color: 'text-yellow-400', emoji: '⚡' },
  high: { label: 'Alta', color: 'text-emerald-400', emoji: '⚡' },
  very_high: { label: 'Muy alta', color: 'text-green-400', emoji: '🔥' },
};

const MOOD_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  very_negative: { label: 'Muy negativo', color: 'text-red-400', emoji: '😞' },
  negative: { label: 'Negativo', color: 'text-orange-400', emoji: '😕' },
  neutral: { label: 'Neutro', color: 'text-yellow-400', emoji: '😐' },
  positive: { label: 'Positivo', color: 'text-emerald-400', emoji: '😊' },
  very_positive: { label: 'Muy positivo', color: 'text-green-400', emoji: '😄' },
};

export function EntryDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id || !user) return;

    let isMounted = true;

    async function loadEntry() {
      setIsLoading(true);
      try {
        const result = await fetchEntryById(id!, user!.uid);
        if (!result) {
          if (isMounted) setErrorMessage('Entrada no encontrada.');
          return;
        }

        if (isMounted) setEntry(result);

        // If contextualResponse is undefined, generate it now
        if (result.contextualResponse === undefined) {
          if (isMounted) setIsGeneratingResponse(true);

          try {
            // Fetch last 5 entries to give context (excluding the current one if it's the newest, though fetchRecentEntries will include it)
            const recentEntries = await fetchRecentEntries(user!.uid, 5);
            
            const aiResult = await generateContextualResponse(result, recentEntries, profile);
            
            // Null means no meaningful pattern found (Minimum Intervention Principle)
            const responseText = aiResult.response ?? null;

            await updateEntryContextualResponse(id!, responseText);
            
            if (isMounted) {
              setEntry((prev) => prev ? { ...prev, contextualResponse: responseText } : null);
            }
          } catch (error) {
            console.error('Failed to generate contextual response:', error);
            // On failure, we set it to null so we don't infinitely retry
            if (isMounted) {
              setEntry((prev) => prev ? { ...prev, contextualResponse: null } : null);
            }
          } finally {
            if (isMounted) setIsGeneratingResponse(false);
          }
        }
      } catch {
        if (isMounted) setErrorMessage('Error al cargar la entrada. Inténtalo de nuevo.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadEntry();

    return () => {
      isMounted = false;
    };
  }, [id, user]);

  const handleDelete = async () => {
    if (!id || !user) return;
    
    setIsDeleting(true);
    try {
      await deleteEntry(id);
      navigate('/');
    } catch (e) {
      console.error('Failed to delete entry:', e);
      setErrorMessage('Error al eliminar la entrada.');
      setIsDeleting(false);
    }
  };

  if (isLoading || isDeleting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (errorMessage || !entry) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6">
        <p className="text-muted-foreground">{errorMessage ?? 'Entrada no encontrada.'}</p>
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="gap-2 rounded-xl border-border/50"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
      </div>
    );
  }

  const { analysis, contextualResponse } = entry;
  const energyInfo = analysis.perceivedEnergy ? ENERGY_CONFIG[analysis.perceivedEnergy] : null;
  const moodInfo = analysis.perceivedMood ? MOOD_CONFIG[analysis.perceivedMood] : null;

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background">
      <header className="glass sticky top-0 z-20 flex items-center justify-between border-b border-border/40 px-5 py-3 bg-background/80 backdrop-blur-md">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="relative gap-2 rounded-xl px-3 text-foreground hover:bg-foreground/10"
          disabled={isDeleting}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={isDeleting}
          className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label="Delete entry"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </header>

      <div className="relative overflow-hidden border-b border-border/40 px-5 pb-6 pt-5">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative">
          <p className="text-sm font-medium text-muted-foreground">
            {format(entry.createdAt, 'PPPP')}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground/60">
            {format(entry.createdAt, 'p')}
          </p>
        </div>
      </div>

      <div className="space-y-4 px-5 pb-24 pt-6 animate-slide-up">
        {isGeneratingResponse && (
          <div className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-5 animate-pulse">
            <Sparkles className="h-5 w-5 text-primary" />
            <p className="text-sm text-primary/80">Reflexionando sobre tus sesiones recientes...</p>
          </div>
        )}

        {!isGeneratingResponse && contextualResponse && (
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5 backdrop-blur-sm">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">
                Trainlog AI
              </h3>
            </div>
            <div className="text-sm font-medium leading-relaxed text-foreground">
              <ReactMarkdown
                components={{
                  p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                  ul: ({ node, ...props }) => (
                    <ul className="mb-2 list-disc pl-5 last:mb-0 space-y-1" {...props} />
                  ),
                  strong: ({ node, ...props }) => (
                    <strong className="font-bold text-primary" {...props} />
                  ),
                  img: ({ node, ...props }) => (
                    <img className="mt-3 w-full max-w-sm rounded-xl border border-primary/20 shadow-sm" loading="lazy" {...props} />
                  ),
                }}
              >
                {contextualResponse}
              </ReactMarkdown>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-border/40 bg-card/50 p-5 backdrop-blur-sm">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Resumen
          </h3>
          <p className="text-sm leading-relaxed text-foreground">{analysis.summary}</p>
        </div>

        {((analysis.themes?.length ?? 0) > 0 || (analysis.activities?.length ?? 0) > 0) && (
          <div className="rounded-2xl border border-border/40 bg-card/50 p-5 backdrop-blur-sm">
            {(analysis.themes?.length ?? 0) > 0 && (
              <div className="mb-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Temas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.themes?.map((theme) => (
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

            {(analysis.activities?.length ?? 0) > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Actividades
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.activities?.map((activity) => (
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

        {(energyInfo || moodInfo) && (
          <div className="grid grid-cols-2 gap-3">
            {energyInfo && (
              <div className="rounded-2xl border border-border/40 bg-card/50 p-4 backdrop-blur-sm">
                <div className="mb-2 flex items-center gap-2">
                  <Zap className={`h-4 w-4 ${energyInfo.color}`} />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Energía
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
                    Estado de ánimo
                  </h3>
                </div>
                <p className={`text-sm font-semibold ${moodInfo.color}`}>
                  {moodInfo.emoji} {moodInfo.label}
                </p>
              </div>
            )}
          </div>
        )}

        {analysis.reflectionPrompt && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary/70">
              Para reflexionar
            </h3>
            <p className="text-sm italic leading-relaxed text-foreground/80">
              {analysis.reflectionPrompt}
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-border/40 bg-card/50 p-5 backdrop-blur-sm">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Transcripción original
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {entry.transcript}
          </p>
        </div>
      </div>
    </div>
  );
}
