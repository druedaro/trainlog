import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Check, RotateCcw } from 'lucide-react';
import type { EntryAnalysis } from '@/types/entry';

interface AnalysisViewProps {
  analysis: EntryAnalysis;
  onConfirm: () => void;
  onRetry: () => void;
  isSaving?: boolean;
}

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

export function AnalysisView({
  analysis,
  onConfirm,
  onRetry,
  isSaving = false,
}: AnalysisViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Your reflection analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        <div>
          <h3 className="mb-1 text-sm font-medium text-muted-foreground">
            Summary
          </h3>
          <p className="text-sm leading-relaxed">{analysis.summary}</p>
        </div>

        {/* Themes */}
        {analysis.themes.length > 0 && (
          <div>
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

        {/* Energy & Mood */}
        <div className="grid grid-cols-2 gap-4">
          {analysis.perceivedEnergy && (
            <div>
              <h3 className="mb-1 text-sm font-medium text-muted-foreground">
                Energy
              </h3>
              <p className="text-sm">
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
              <p className="text-sm">
                {MOOD_LABELS[analysis.perceivedMood] ?? analysis.perceivedMood}
              </p>
            </div>
          )}
        </div>

        {/* Activities */}
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
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          onClick={onConfirm}
          disabled={isSaving}
          className="flex-1 gap-2"
        >
          <Check className="h-4 w-4" />
          {isSaving ? 'Saving…' : 'Confirm & Save'}
        </Button>
        <Button
          variant="outline"
          onClick={onRetry}
          disabled={isSaving}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
