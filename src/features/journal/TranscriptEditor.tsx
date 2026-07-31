import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Pencil className="h-4 w-4" />
          Review your transcript
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent>
          <textarea
            {...register('transcript', {
              required: 'Transcript cannot be empty.',
              validate: (value) =>
                value.trim().length > 0 || 'Transcript cannot be empty.',
            })}
            className="min-h-[150px] w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Your transcript will appear here..."
            disabled={isSubmitting}
          />
          {formState.errors.transcript && (
            <p className="mt-1 text-sm text-destructive">
              {formState.errors.transcript.message}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Edit the text if needed, then confirm to analyze your reflection.
          </p>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 gap-2"
          >
            <Check className="h-4 w-4" />
            {isSubmitting ? 'Analyzing…' : 'Confirm & Analyze'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onDiscard}
            disabled={isSubmitting}
          >
            Discard
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
