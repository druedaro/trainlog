import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router';

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
  const { user } = useAuth();
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
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-background">
      {/* Glass header */}
      <header className="glass sticky top-0 z-20 border-b border-border/40 px-5 py-3.5">
        <div className="flex items-center justify-center h-9">
          <h1 className="text-lg font-bold text-gradient">Trainlog</h1>
        </div>
      </header>

      <main className="flex-1 px-5 py-6">
        {/* Error display */}
        {(errorMessage || recorder.errorMessage) && (
          <div className="mb-5 animate-scale-in rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
            <p className="text-sm text-destructive">
              {errorMessage ?? recorder.errorMessage}
            </p>
          </div>
        )}

        {/* Flow: Idle - Show record button + calendar */}
        {flowStep === 'idle' && !hasBlob && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-center pt-6">
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
          <div className="flex justify-center pt-12 animate-fade-in">
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
          <div className="flex flex-col items-center gap-5 pt-10 animate-slide-up">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-primary">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">Recording complete!</p>
            <div className="flex w-full max-w-xs gap-3">
              <Button
                onClick={handleTranscribe}
                className="flex-1 rounded-xl bg-primary py-5 font-semibold text-primary-foreground"
              >
                Transcribe
              </Button>
              <Button
                variant="outline"
                onClick={resetFlow}
                className="rounded-xl border-border/50 py-5"
              >
                Discard
              </Button>
            </div>
          </div>
        )}

        {/* Flow: Transcribing */}
        {flowStep === 'transcribing' && (
          <div className="flex flex-col items-center gap-5 pt-16 animate-fade-in">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary/30 border-t-primary" />
            <p className="text-sm text-muted-foreground">Transcribing your recording…</p>
          </div>
        )}

        {/* Flow: Editing transcript */}
        {flowStep === 'editing' && (
          <div className="animate-slide-up">
            <TranscriptEditor
              transcript={transcript}
              onConfirm={handleConfirmTranscript}
              onDiscard={resetFlow}
              isSubmitting={false}
            />
          </div>
        )}

        {/* Flow: Analyzing */}
        {flowStep === 'analyzing' && (
          <div className="flex flex-col items-center gap-5 pt-16 animate-fade-in">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary/30 border-t-primary" />
            <p className="text-sm text-muted-foreground">Analyzing your reflection…</p>
          </div>
        )}

        {/* Flow: Reviewing analysis */}
        {flowStep === 'reviewing' && analysis && (
          <div className="animate-slide-up">
            <AnalysisView
              analysis={analysis}
              onConfirm={handleConfirmAnalysis}
              onRetry={() => {
                setAnalysis(null);
                setFlowStep('editing');
              }}
              isSaving={false}
            />
          </div>
        )}

        {/* Flow: Saving */}
        {flowStep === 'saving' && (
          <div className="flex flex-col items-center gap-5 pt-16 animate-fade-in">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary/30 border-t-primary" />
            <p className="text-sm text-muted-foreground">Saving your entry…</p>
          </div>
        )}
      </main>
    </div>
  );
}
