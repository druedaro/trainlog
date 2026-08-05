import { Button } from '@/components/ui/button';
import { Check, RotateCcw, Zap, Smile } from 'lucide-react';
import type { EntryAnalysis } from '@/types/entry';

interface AnalysisViewProps {
  analysis: EntryAnalysis;
  onConfirm: () => void;
  onRetry: () => void;
  isSaving?: boolean;
}

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

export function AnalysisView({
  analysis,
  onConfirm,
  onRetry,
  isSaving = false,
}: AnalysisViewProps) {
  const energyInfo = analysis.perceivedEnergy ? ENERGY_CONFIG[analysis.perceivedEnergy] : null;
  const moodInfo = analysis.perceivedMood ? MOOD_CONFIG[analysis.perceivedMood] : null;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground">Análisis de tu reflexión</h2>

      {/* Summary */}
      <div className="rounded-2xl border border-border/40 bg-card/50 p-5 backdrop-blur-sm">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Resumen
        </h3>
        <p className="text-sm leading-relaxed text-foreground">{analysis.summary}</p>
      </div>

      {/* Themes & Activities */}
      {((analysis.themes?.length ?? 0) > 0 || (analysis.activities?.length ?? 0) > 0) && (
        <div className="rounded-2xl border border-border/40 bg-card/50 p-5 backdrop-blur-sm space-y-4">
          {(analysis.themes?.length ?? 0) > 0 && (
            <div>
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

      {/* Energy & Mood */}
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

      {/* Reflection prompt */}
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

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button
          onClick={onConfirm}
          disabled={isSaving}
          className="flex-1 gap-2 rounded-xl bg-primary py-5 font-semibold text-primary-foreground"
        >
          <Check className="h-4 w-4" />
          {isSaving ? 'Guardando…' : 'Confirmar y guardar'}
        </Button>
        <Button
          variant="outline"
          onClick={onRetry}
          disabled={isSaving}
          className="rounded-xl border-border/50 px-4 py-5"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
