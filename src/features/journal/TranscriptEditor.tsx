import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Check, Pencil } from 'lucide-react';

interface TranscriptEditorProps {
  transcript: string;
  onConfirm: (editedTranscript: string) => void;
  onDiscard: () => void;
  isSubmitting?: boolean;
}

interface TranscriptFormValues {
  transcript: string;
}

export function TranscriptEditor({
  transcript,
  onConfirm,
  onDiscard,
  isSubmitting = false,
}: TranscriptEditorProps) {
  const { register, handleSubmit, formState } = useForm<TranscriptFormValues>({
    defaultValues: { transcript },
  });

  const onSubmit = (values: TranscriptFormValues) => {
    const trimmed = values.transcript.trim();

    if (trimmed.length === 0) return;

    onConfirm(trimmed);
  };

  return (
    <div className="rounded-2xl border border-border/40 bg-card/50 p-5 backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Pencil className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Review your transcript</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <textarea
          {...register('transcript', {
            required: 'Transcript cannot be empty.',
            validate: (value) =>
              value.trim().length > 0 || 'Transcript cannot be empty.',
          })}
          className="min-h-[180px] w-full resize-y rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm leading-relaxed text-foreground ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Your transcript will appear here..."
          disabled={isSubmitting}
        />
        {formState.errors.transcript && (
          <p className="mt-1.5 text-sm text-destructive">
            {formState.errors.transcript.message}
          </p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Edit the text if needed, then confirm to analyze your reflection.
        </p>

        <div className="mt-5 flex gap-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 gap-2 rounded-xl bg-primary py-5 font-semibold text-primary-foreground"
          >
            <Check className="h-4 w-4" />
            {isSubmitting ? 'Analyzing…' : 'Confirm & Analyze'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onDiscard}
            disabled={isSubmitting}
            className="rounded-xl border-border/50 py-5"
          >
            Discard
          </Button>
        </div>
      </form>
    </div>
  );
}
