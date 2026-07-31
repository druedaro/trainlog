import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import { useVoiceRecorder } from '@/features/journal/useVoiceRecorder';
import { RecordButton } from '@/features/journal/RecordButton';
import { TranscriptEditor } from '@/features/journal/TranscriptEditor';
import { AnalysisView } from '@/features/journal/AnalysisView';
import { CalendarView } from '@/features/journal/CalendarView';
import { transcribeAudio, analyzeReflection, ApiError } from '@/lib/api';
import { saveConfirmedEntry } from '@/lib/firestore';
import { entryAnalysisSchema, type EntryAnalysis } from '@/types/entry';

type FlowStep = 'idle' | 'transcribing' | 'editing' | 'analyzing' | 'reviewing' | 'saving';

export function JournalPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const recorder = useVoiceRecorder();

  const [flowStep, setFlowStep] = useState<FlowStep>('idle');
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState<EntryAnalysis | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetFlow = useCallback(() => {
    setFlowStep('idle');
    setTranscript('');
    setAnalysis(null);
    setErrorMessage(null);
    recorder.resetRecording();
  }, [recorder]);

  const handleStopRecording = useCallback(async () => {
    recorder.stopRecording();
  }, [recorder]);

  // After recording stops and we have a blob, transcribe it
  const handleTranscribe = useCallback(async () => {
    if (!recorder.audioBlob) return;

    setFlowStep('transcribing');
    setErrorMessage(null);

    try {
      const result = await transcribeAudio(recorder.audioBlob);
      setTranscript(result);
      setFlowStep('editing');
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Transcription failed. Please try again.';
      setErrorMessage(message);
      setFlowStep('idle');
    }
  }, [recorder.audioBlob]);

  const handleConfirmTranscript = useCallback(
    async (editedTranscript: string) => {
      setTranscript(editedTranscript);
      setFlowStep('analyzing');
      setErrorMessage(null);

      try {
        const rawAnalysis = await analyzeReflection(editedTranscript);
        const validated = entryAnalysisSchema.safeParse(rawAnalysis);

        if (!validated.success) {
          setErrorMessage(
            'The analysis did not meet quality standards. Please try again.',
          );
          setFlowStep('editing');
          return;
        }

        setAnalysis(validated.data);
        setFlowStep('reviewing');
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : 'Analysis failed. Please try again.';
        setErrorMessage(message);
        setFlowStep('editing');
      }
    },
    [],
  );

  const handleConfirmAnalysis = useCallback(async () => {
    if (!analysis || !user) return;

    setFlowStep('saving');
    setErrorMessage(null);

    try {
      const entryId = await saveConfirmedEntry({
        userId: user.uid,
        transcript,
        analysis,
      });

      resetFlow();
      navigate(`/entry/${entryId}`);
    } catch {
      setErrorMessage('Failed to save the entry. Please try again.');
      setFlowStep('reviewing');
    }
  }, [analysis, user, transcript, resetFlow, navigate]);

  // When audioBlob becomes available after recording, auto-trigger transcription
  const hasBlob = recorder.audioBlob !== null;

  return (
    <div className="mx-auto min-h-screen max-w-lg">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <h1 className="text-lg font-semibold">Trainlog</h1>
        <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      <main className="px-4 py-6">
        {/* Error display */}
        {(errorMessage || recorder.errorMessage) && (
          <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
            <p className="text-sm text-destructive">
              {errorMessage ?? recorder.errorMessage}
            </p>
          </div>
        )}

        {/* Flow: Idle - Show record button + calendar */}
        {flowStep === 'idle' && !hasBlob && (
          <div className="space-y-8">
            <div className="flex justify-center pt-8">
              <RecordButton
                isRecording={recorder.status === 'recording'}
                durationMs={recorder.durationMs}
                onStart={recorder.startRecording}
                onStop={handleStopRecording}
              />
            </div>
            <CalendarView />
          </div>
        )}

        {/* Flow: Recording in progress */}
        {recorder.status === 'recording' && (
          <div className="flex justify-center pt-16">
            <RecordButton
              isRecording
              durationMs={recorder.durationMs}
              onStart={recorder.startRecording}
              onStop={handleStopRecording}
            />
          </div>
        )}

        {/* Flow: Recording done, ready to transcribe */}
        {flowStep === 'idle' && hasBlob && (
          <div className="flex flex-col items-center gap-4 pt-8">
            <p className="text-sm text-muted-foreground">Recording complete!</p>
            <div className="flex gap-2">
              <Button onClick={handleTranscribe} className="gap-2">
                Transcribe
              </Button>
              <Button variant="outline" onClick={resetFlow}>
                Discard
              </Button>
            </div>
          </div>
        )}

        {/* Flow: Transcribing */}
        {flowStep === 'transcribing' && (
          <div className="flex flex-col items-center gap-4 pt-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Transcribing your recording…</p>
          </div>
        )}

        {/* Flow: Editing transcript */}
        {flowStep === 'editing' && (
          <TranscriptEditor
            transcript={transcript}
            onConfirm={handleConfirmTranscript}
            onDiscard={resetFlow}
            isSubmitting={false}
          />
        )}

        {/* Flow: Analyzing */}
        {flowStep === 'analyzing' && (
          <div className="flex flex-col items-center gap-4 pt-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Analyzing your reflection…</p>
          </div>
        )}

        {/* Flow: Reviewing analysis */}
        {flowStep === 'reviewing' && analysis && (
          <AnalysisView
            analysis={analysis}
            onConfirm={handleConfirmAnalysis}
            onRetry={() => {
              setAnalysis(null);
              setFlowStep('editing');
            }}
            isSaving={false}
          />
        )}

        {/* Flow: Saving */}
        {flowStep === 'saving' && (
          <div className="flex flex-col items-center gap-4 pt-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Saving your entry…</p>
          </div>
        )}
      </main>
    </div>
  );
}
