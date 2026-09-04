import { useState, useRef, useEffect } from 'react';
import { ChevronRight, Bell, Shield, User as UserIcon, Mic, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { saveUserProfile } from '@/lib/firestore';
import { requestPushPermissions } from '@/lib/push';
import { toast } from 'sonner';
import { type Gender, userProfileSchema, UserProfile } from '@/types/user';
import { User } from 'firebase/auth';
import { useQueryClient } from '@tanstack/react-query';

interface OnboardingFormProps {
  user: User;
  profile: UserProfile | null;
  forceShow: boolean;
  onClose?: () => void;
}

export function OnboardingForm({ user, profile, forceShow, onClose }: OnboardingFormProps) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(profile?.name || user?.displayName || '');
  const [age, setAge] = useState<string>(profile?.age?.toString() || '');
  const [gender, setGender] = useState<Gender | ''>(profile?.gender || '');
  const [personalContext, setPersonalContext] = useState(profile?.personalContext || '');
  const [trainingDays, setTrainingDays] = useState<number[]>(profile?.trainingDays || [1, 2, 3, 4, 5]);
  
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
    if (!name.trim() || !age || !gender || !privacyAccepted) {
      toast.error('Por favor completa todos los campos requeridos.');
      return;
    }
    const profileData = {
      uid: user.uid,
      name: name.trim(),
      age: parseInt(age, 10),
      gender: gender as Gender,
      personalContext: personalContext.trim(),
      trainingDays,
      onboardingCompleted: true,
    };

    const parsed = userProfileSchema.partial().safeParse(profileData);
    if (!parsed.success) {
      toast.error(parsed.error?.errors[0]?.message || 'Error de validación');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await saveUserProfile(user.uid, parsed.data);
      await queryClient.invalidateQueries({ queryKey: ['profile', user.uid] });
      toast.success(forceShow ? 'Tutorial completado.' : '¡Bienvenido a TrainLog!');
      if (onClose) onClose();
    } catch (e) {
      toast.error('Error al guardar el perfil.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 relative">
      {forceShow && onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      )}
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
                  maxLength={50}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre o apodo"
                  className="w-full rounded-xl border border-border/50 bg-background/50 py-3 pl-10 pr-12 text-sm text-foreground outline-none transition-colors focus:border-primary focus:bg-background"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
                  {name.length}/50
                </div>
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
              <label className="text-sm font-medium text-foreground">Sexo</label>
              <div className="grid grid-cols-2 gap-2">
                {['masculino', 'femenino', 'otro', 'prefiero no decirlo'].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g as Gender)}
                    className={`rounded-xl border p-3 text-sm capitalize transition-all ${
                      gender === g
                        ? 'border-primary bg-primary/10 font-medium text-primary shadow-sm'
                        : 'border-border/50 bg-background/50 text-muted-foreground hover:bg-accent/50'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <Button
              className="mt-6 w-full rounded-xl p-6 text-sm font-semibold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
              onClick={() => {
                if (!name.trim() || !age || !gender) {
                  toast.error('Por favor completa todos los campos para continuar.');
                  return;
                }
                setStep(2);
              }}
            >
              Siguiente paso <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : step === 2 ? (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex justify-between items-center">
                <span>¿Hay algo importante que Anna deba saber?</span>
                <span className="text-xs text-muted-foreground">(Opcional)</span>
              </label>
              <p className="text-[11px] text-muted-foreground/80 mb-2">
                Ejemplo: "Estoy recuperándome de una lesión de rodilla", "Acabo de tener un bebé", "Busco ganar masa muscular".
              </p>
              <div className="relative">
                <textarea
                  value={personalContext}
                  maxLength={400}
                  onChange={(e) => setPersonalContext(e.target.value)}
                  placeholder="Tu contexto personal aquí..."
                  className="min-h-[140px] w-full resize-none rounded-xl border border-border/50 bg-background/50 p-4 pb-12 text-sm text-foreground outline-none transition-colors focus:border-primary focus:bg-background"
                />
                
                <div className="mt-2 flex items-center justify-between">
                  <Button
                    variant={isRecording ? 'destructive' : 'secondary'}
                    size="sm"
                    onClick={isRecording ? stopRecording : startRecording}
                    className="h-8 rounded-full px-3 text-xs"
                  >
                    <Mic className={`mr-1.5 h-3.5 w-3.5 ${isRecording ? 'animate-pulse' : ''}`} />
                    {isRecording ? 'Grabando...' : 'Dictar'}
                  </Button>
                  <div className="text-[10px] text-muted-foreground">
                    {personalContext.length}/400
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <label className="text-sm font-medium text-foreground">Días de entrenamiento habituales</label>
              <p className="text-[11px] text-muted-foreground/80 mb-2">
                Si descansas un día que no marcas aquí, no perderás tu racha activa.
              </p>
              <div className="flex justify-between gap-1">
                {[
                  { id: 1, label: 'L' },
                  { id: 2, label: 'M' },
                  { id: 3, label: 'X' },
                  { id: 4, label: 'J' },
                  { id: 5, label: 'V' },
                  { id: 6, label: 'S' },
                  { id: 0, label: 'D' },
                ].map((day) => (
                  <button
                    key={day.id}
                    onClick={() => {
                      setTrainingDays(prev => 
                        prev.includes(day.id) 
                          ? prev.filter(d => d !== day.id) 
                          : [...prev, day.id]
                      );
                    }}
                    className={`w-10 h-10 rounded-full text-xs font-semibold flex items-center justify-center transition-all ${
                      trainingDays.includes(day.id)
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-accent text-muted-foreground hover:bg-accent/80'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="w-1/3 rounded-xl p-6 text-sm"
                onClick={() => setStep(1)}
              >
                Atrás
              </Button>
              <Button
                className="w-2/3 rounded-xl p-6 text-sm font-semibold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]"
                onClick={() => setStep(3)}
              >
                Siguiente <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div
              className="flex cursor-pointer items-start gap-4 rounded-xl border border-border/50 bg-background/50 p-4 transition-colors hover:bg-accent/50"
              onClick={handleRequestNotifications}
            >
              <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${notificationsEnabled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                <Bell className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">Recordatorios</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Recibe un empujoncito diario para registrar tu sesión y mantener la racha.
                </p>
                <div className="mt-2 text-xs font-medium text-primary">
                  {notificationsEnabled ? '✓ Activadas' : 'Activar notificaciones'}
                </div>
              </div>
            </div>

            <div
              className="flex cursor-pointer items-start gap-4 rounded-xl border border-border/50 bg-background/50 p-4 transition-colors hover:bg-accent/50"
              onClick={() => setPrivacyAccepted(!privacyAccepted)}
            >
              <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${privacyAccepted ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                <Shield className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground">Privacidad (Requerido)</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Acepto que TrainLog procese mi diario para generar mis resúmenes (usamos IA segura y no leemos tus datos).
                </p>
                <div className="mt-2 text-xs font-medium">
                  {privacyAccepted ? <span className="text-primary">✓ Aceptado</span> : <span className="text-muted-foreground">Toca para aceptar</span>}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="w-1/3 rounded-xl p-6 text-sm"
                onClick={() => setStep(2)}
              >
                Atrás
              </Button>
              <Button
                className="w-2/3 rounded-xl bg-foreground text-background p-6 text-sm font-bold shadow-xl transition-all hover:scale-[1.02] hover:bg-foreground/90 disabled:opacity-50"
                onClick={handleComplete}
                disabled={isSubmitting || !privacyAccepted}
              >
                {isSubmitting ? 'Guardando...' : '¡Empezar!'}
              </Button>
            </div>
          </div>
        )}
    </div>
  );
}
