import { Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecordButtonProps {
  isRecording: boolean;
  durationMs: number;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function RecordButton({
  isRecording,
  durationMs,
  onStart,
  onStop,
  disabled = false,
}: RecordButtonProps) {
  if (isRecording) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-destructive/20" />
          <Button
            onClick={onStop}
            size="icon"
            variant="destructive"
            className="relative h-20 w-20 rounded-full shadow-lg"
            aria-label="Stop recording"
          >
            <Square className="h-8 w-8 fill-current" />
          </Button>
        </div>
        <p className="tabular-nums text-lg font-medium text-destructive">
          {formatDuration(durationMs)}
        </p>
        <p className="text-sm text-muted-foreground">Recording… Tap to stop</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Button
        onClick={onStart}
        size="icon"
        disabled={disabled}
        className="h-20 w-20 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label="Start recording"
      >
        <Mic className="h-8 w-8" />
      </Button>
      <p className="text-sm text-muted-foreground">Tap to start recording</p>
    </div>
  );
}
