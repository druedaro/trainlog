import { useState, useEffect, useRef } from 'react';
import { ChevronRight, Bell, Shield, User as UserIcon, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import { saveUserProfile } from '@/lib/firestore';
import { requestPushPermissions } from '@/lib/push';
import { toast } from 'sonner';
import type { Gender } from '@/types/user';

export function OnboardingModal() {
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(profile?.name || user?.displayName || '');
  const [age, setAge] = useState<string>(profile?.age?.toString() || '');
  const [gender, setGender] = useState<Gender | ''>(profile?.gender || '');
  const [personalContext, setPersonalContext] = useState(profile?.personalContext || '');
  
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  const handleRequestNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('Las notificaciones no están soportadas en este navegador.');
      return;
    }
    try {
      if (!user) {
        toast.error('Debes iniciar sesión primero');
        return;
      }
      toast.loading('Solicitando permisos...', { id: 'push' });
      const success = await requestPushPermissions(user.uid);
      if (success) {
        setNotificationsEnabled(true);
        toast.success('Notificaciones activadas', { id: 'push' });
      } else {
        toast.error('Permiso denegado', { id: 'push' });
      }
    } catch (e) {
      toast.error('No se pudo solicitar permiso', { id: 'push' });
    }
  };

  const startRecording = () => {
    const win = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Tu navegador no soporta reconocimiento de voz.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setPersonalContext(prev => (prev ? prev + ' ' + finalTranscript : finalTranscript));
      }
    };

    recognition.onerror = () => {
      setIsRecording(false);
      toast.error('Error al escuchar.');
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleComplete = async () => {
    if (!user) return;
    if (!name.trim() || !age || !gender || !privacyAccepted) {
      toast.error('Por favor completa todos los campos requeridos.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await saveUserProfile(user.uid, {
        uid: user.uid,
        name: name.trim(),
        age: parseInt(age, 10),
        gender: gender as Gender,
        personalContext: personalContext.trim(),
        onboardingCompleted: true,
      });
      await refreshProfile();
      toast.success('¡Bienvenido a TrainLog!');
    } catch (e) {
      toast.error('Error al guardar el perfil.');
      setIsSubmitting(false);
    }
  };

  
  if (profile?.onboardingCompleted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl border border-border/50 bg-background/60 shadow-2xl backdrop-blur-xl animate-scale-in"
      >
        <div className="p-6 sm:p-8">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <span className="text-3xl">👋</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              {step === 1 ? '¡Hola, atleta!' : step === 2 ? 'Contexto Vital' : 'Ya casi terminamos'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {step === 1 
                ? 'Queremos conocerte un poco mejor para que nuestra IA adapte tu experiencia al milímetro.'
                : step === 2
                ? 'Ayuda a Anna a entender tu situación actual para darte un apoyo emocional 100% personalizado.'
                : 'Configura tus preferencias para sacar el máximo partido a tu diario.'}
            </p>
          </div>

            {step === 1 ? (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">¿Cómo te llamas?</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Tu nombre o apodo"
                      className="w-full rounded-xl border border-border/50 bg-background/50 py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-primary focus:bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">¿Cuál es tu edad?</label>
                  <input
                    type="number"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Ej. 28"
                    min="13"
                    max="100"
                    className="w-full rounded-xl border border-border/50 bg-background/50 p-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Género</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full rounded-xl border border-border/50 bg-background/50 p-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:bg-background"
                  >
                    <option value="" disabled hidden>¿Cuál es tu género?</option>
                    <option value="masculino">Hombre</option>
                    <option value="femenino">Mujer</option>
                    <option value="otro">Otro</option>
                    <option value="prefiero no decirlo">Prefiero no decirlo</option>
                  </select>
                </div>

                <Button
                  onClick={() => setStep(2)}
                  disabled={!name.trim() || !age || !gender}
                  className="mt-6 w-full rounded-xl py-6 font-semibold"
                >
                  Continuar
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : step === 2 ? (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex justify-between items-center">
                    <span>Contexto Vital (Opcional)</span>
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Si estás pasando por una lesión, un duelo, o tienes una meta específica, díselo a Anna para que su apoyo sea empático y real.
                  </p>
                  <div className="relative">
                    <textarea
                      value={personalContext}
                      onChange={(e) => setPersonalContext(e.target.value)}
                      placeholder="Ej: Estoy pasando por un duelo amoroso y hacer clases dirigidas me ayuda a desconectar..."
                      className="w-full min-h-[120px] rounded-xl border border-border/50 bg-background/50 p-4 text-sm text-foreground outline-none transition-colors focus:border-primary focus:bg-background resize-none"
                    />
                    <div className="absolute bottom-3 right-3">
                      {((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`h-8 w-8 rounded-full ${isRecording ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-primary/10 text-primary hover:bg-primary/20'}`}
                        >
                          <Mic className={`h-4 w-4 ${isRecording ? 'animate-pulse' : ''}`} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="w-1/3 rounded-xl py-6 font-semibold"
                  >
                    Volver
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    className="w-2/3 rounded-xl py-6 font-semibold"
                  >
                    Siguiente
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="rounded-2xl border border-border/50 bg-background/40 p-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                      <Bell className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-foreground">Recordatorios</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Activa las notificaciones para no olvidarte de registrar tus entrenamientos.
                      </p>
                      {!notificationsEnabled ? (
                        <button
                          onClick={handleRequestNotifications}
                          className="mt-3 text-xs font-semibold text-blue-500 hover:text-blue-600"
                        >
                          Permitir notificaciones
                        </button>
                      ) : (
                        <p className="mt-3 text-xs font-medium text-emerald-500">
                          ✓ Activadas
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border/50 bg-background/40 p-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-foreground">Privacidad</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Usamos inteligencia artificial para analizar tus entrenamientos. Tus datos están seguros y no se venden a terceros (RGPD).
                      </p>
                      <label className="mt-3 flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={privacyAccepted}
                          onChange={(e) => setPrivacyAccepted(e.target.checked)}
                          className="h-4 w-4 rounded border-border text-primary accent-primary"
                        />
                        <span className="text-xs font-medium text-foreground">Acepto la política de privacidad</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="w-1/3 rounded-xl py-6 font-semibold"
                  >
                    Volver
                  </Button>
                  <Button
                    onClick={handleComplete}
                    disabled={!privacyAccepted || isSubmitting}
                    className="w-2/3 rounded-xl py-6 font-semibold"
                  >
                    {isSubmitting ? (
                      <span className="animate-spin text-xl">⏳</span>
                    ) : (
                      'Empezar mi diario'
                    )}
                  </Button>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
