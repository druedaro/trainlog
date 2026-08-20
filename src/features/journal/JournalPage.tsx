import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Activity, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import { useVoiceRecorder } from '@/features/journal/useVoiceRecorder';
import { RecordButton } from '@/features/journal/RecordButton';
import { TranscriptEditor } from '@/features/journal/TranscriptEditor';
import { AnalysisView } from '@/features/journal/AnalysisView';
import { CalendarView } from '@/features/journal/CalendarView';
import { JournalInstructionsModal } from '@/features/journal/JournalInstructionsModal';
import { RecentEntries } from '@/features/journal/RecentEntries';
import { MonthlyReportModal, type MonthlyReport } from '@/features/insights/MonthlyReportModal';
import { transcribeAudio, analyzeReflection, ApiError } from '@/lib/api';
import { saveConfirmedEntry, fetchUserStreak, checkAndGenerateMonthlyReport, unlockAchievements } from '@/lib/firestore';
import { checkAchievements, ACHIEVEMENTS } from '@/lib/gamification';
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
  const [showInstructions, setShowInstructions] = useState(false);
  const [streak, setStreak] = useState<number>(0);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [checkingReport, setCheckingReport] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserStreak(user.uid)
        .then(setStreak)
        .catch(console.error);
        
      if (!checkingReport) {
        setCheckingReport(true);
        import('@/lib/firestore').then(({ fetchUserProfile }) => {
          fetchUserProfile(user.uid).then(profile => {
            if (profile) {
              checkAndGenerateMonthlyReport(user.uid, profile)
                .then(report => {


                  if (report) {
                    const shownKey = `report_shown_${report.id}`;
                    if (!localStorage.getItem(shownKey)) {
                      setMonthlyReport(report);
                      localStorage.setItem(shownKey, 'true');
                    }
                  }
                })
                .catch(console.error);
            }
          });
        });
      }
    }
  }, [user]);

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
          : 'Error en la transcripción. Inténtalo de nuevo.';
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
            'El análisis no cumplió los estándares de calidad. Inténtalo de nuevo.',
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
            : 'Error en el análisis. Inténtalo de nuevo.';
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

      if (profile) {
        const currentStreak = await fetchUserStreak(user.uid);
        const newUnlocks = checkAchievements(profile.achievements || [], {
          entryCount: 1,
          streak: currentStreak,
          transcript
        });

        if (newUnlocks.length > 0) {
          await unlockAchievements(user.uid, newUnlocks);
          newUnlocks.forEach(id => {
            const ach = ACHIEVEMENTS[id];
            toast.success(`🏆 ¡Logro desbloqueado: ${ach?.title}!`, { duration: 5000 });
          });
        }
      }

      resetFlow();
      navigate(`/entry/${entryId}`);
    } catch {
      setErrorMessage('Error al guardar la entrada. Inténtalo de nuevo.');
      setFlowStep('reviewing');
    }
  }, [analysis, user, transcript, resetFlow, navigate]);

  
  const hasBlob = recorder.audioBlob !== null;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col bg-background">
      <header className="glass sticky top-0 z-20 border-b border-border/40 px-5 py-3.5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold text-gradient">Trainlog</h1>
        </div>
        <div className="flex items-center gap-3">
          {streak > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 border border-orange-500/20">
              <span className="text-sm font-bold text-orange-500">{streak}</span>
              <span className="text-sm">🔥</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 px-5 py-6">
        {(errorMessage || recorder.errorMessage) && (
          <div className="mb-5 animate-scale-in rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
            <p className="text-sm text-destructive">
              {errorMessage ?? recorder.errorMessage}
            </p>
          </div>
        )}

        {flowStep === 'idle' && !hasBlob && recorder.status !== 'recording' && (
          <div className="flex flex-col gap-10 lg:gap-14 animate-fade-in pb-8">
            <div className="space-y-8 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-10 lg:items-start">
              <div className="flex flex-col items-center pt-6 lg:pt-16 gap-6 lg:sticky lg:top-28">
                <button 
                  onClick={() => setShowInstructions(true)}
                  className="flex items-center gap-2 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors px-4 py-2 rounded-full border border-primary/20 shadow-sm"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Tips para grabar
                </button>
                <RecordButton
                  isRecording={false}
                  durationMs={recorder.durationMs}
                  onStart={recorder.startRecording}
                  onStop={handleStopRecording}
                />
              </div>
              <div className="flex-1 w-full max-w-md mx-auto">
                <CalendarView />
              </div>
            </div>
            <RecentEntries />
          </div>
        )}

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

        {flowStep === 'idle' && hasBlob && (
          <div className="flex flex-col items-center gap-5 pt-10 animate-slide-up">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-primary">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">¡Grabación completada!</p>
            <div className="flex w-full max-w-xs gap-3">
              <Button
                onClick={handleTranscribe}
                className="flex-1 rounded-xl bg-primary py-5 font-semibold text-primary-foreground"
              >
                Transcribir
              </Button>
              <Button
                variant="outline"
                onClick={resetFlow}
                className="rounded-xl border-border/50 py-5"
              >
                Descartar
              </Button>
            </div>
          </div>
        )}

        {flowStep === 'transcribing' && (
          <div className="flex flex-col items-center gap-5 pt-16 animate-fade-in">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary/30 border-t-primary" />
            <p className="text-sm text-muted-foreground">Transcribiendo tu grabación…</p>
          </div>
        )}

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

        {flowStep === 'analyzing' && (
          <div className="flex flex-col items-center gap-5 pt-16 animate-fade-in">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary/30 border-t-primary" />
            <p className="text-sm text-muted-foreground">Analizando tu reflexión…</p>
          </div>
        )}

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

        {flowStep === 'saving' && (
          <div className="flex flex-col items-center gap-5 pt-16 animate-fade-in">
            <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary/30 border-t-primary" />
            <p className="text-sm text-muted-foreground">Guardando tu entrada…</p>
          </div>
        )}
      </main>

      <JournalInstructionsModal
        isOpen={showInstructions}
        onClose={() => setShowInstructions(false)}
      />
      <MonthlyReportModal 
        report={monthlyReport} 
        onClose={() => setMonthlyReport(null)} 
      />
    </div>
  );
}
