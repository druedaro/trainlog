import { Mic, Square } from 'lucide-react';

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
      <div className="flex flex-col items-center gap-5 animate-fade-in">
        <div className="relative flex items-center justify-center">
          {/* Concentric pulse rings */}
          <div className="absolute h-24 w-24 rounded-full border border-destructive/30 animate-recording-ring-1" />
          <div className="absolute h-24 w-24 rounded-full border border-destructive/20 animate-recording-ring-2" />
          <div className="absolute h-24 w-24 rounded-full border border-destructive/10 animate-recording-ring-3" />

          {/* Stop button */}
          <button
            onClick={onStop}
            className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-destructive glow-destructive transition-transform active:scale-95"
            aria-label="Stop recording"
          >
            <Square className="h-8 w-8 fill-destructive-foreground text-destructive-foreground" />
          </button>
        </div>

        <div className="text-center">
          <p className="tabular-nums text-2xl font-bold text-destructive">
            {formatDuration(durationMs)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Grabando… Toca para parar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-5 animate-fade-in">
      <button
        onClick={onStart}
        disabled={disabled}
        className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary glow-primary transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Start recording"
      >
        <Mic className="h-9 w-9 text-primary-foreground" />
      </button>
      <p className="text-sm text-muted-foreground">Toca para grabar</p>
    </div>
  );
}
