import { useState, useEffect } from 'react';
import { ChevronRight, Bell, Shield, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import { saveUserProfile } from '@/lib/firestore';
import { toast } from 'sonner';
import type { Gender } from '@/types/user';

export function OnboardingModal() {
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(profile?.name || user?.displayName || '');
  const [age, setAge] = useState<string>(profile?.age?.toString() || '');
  const [gender, setGender] = useState<Gender>(profile?.gender || 'prefiero no decirlo');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (Notification.permission === 'granted') {
      setNotificationsEnabled(true);
    }
  }, []);

  const handleRequestNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        toast.success('Notificaciones activadas');
      } else {
        toast.error('Permiso denegado');
      }
    } catch (e) {
      toast.error('No se pudo solicitar permiso');
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    if (!name.trim() || !age || !privacyAccepted) {
      toast.error('Por favor completa todos los campos requeridos.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await saveUserProfile(user.uid, {
        uid: user.uid,
        name: name.trim(),
        age: parseInt(age, 10),
        gender,
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
              {step === 1 ? '¡Hola, atleta!' : 'Ya casi terminamos'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {step === 1 
                ? 'Queremos conocerte un poco mejor para que nuestra IA adapte tu experiencia al milímetro.'
                : 'Configura tus preferencias para sacar el máximo partido a tu diario.'}
            </p>
          </div>

            {step === 1 ? (
              <div
                className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300"
              >
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
                  <label className="text-sm font-medium text-foreground">Sexo</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    className="w-full rounded-xl border border-border/50 bg-background/50 p-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:bg-background"
                  >
                    <option value="masculino">Hombre</option>
                    <option value="femenino">Mujer</option>
                    <option value="otro">Otro</option>
                    <option value="prefiero no decirlo">Prefiero no decirlo</option>
                  </select>
                </div>

                <Button
                  onClick={() => setStep(2)}
                  disabled={!name.trim() || !age}
                  className="mt-6 w-full rounded-xl py-6 font-semibold"
                >
                  Continuar
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300"
              >
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
                    onClick={() => setStep(1)}
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
