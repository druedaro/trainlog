import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Link } from 'react-router';
import { Activity, ChevronRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import { saveUserProfile } from '@/lib/firestore';
import type { Gender } from '@/types/user';

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino', label: 'Femenino' },
  { value: 'otro', label: 'Otro' },
  { value: 'prefiero no decirlo', label: 'Prefiero no decirlo' },
];

export function OnboardingPage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [name, setName] = useState(user?.displayName?.split(' ')[0] ?? '');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<Gender>('prefiero no decirlo');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFinish = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await saveUserProfile(user.uid, {
        uid: user.uid,
        name: name.trim() || user.displayName || 'Usuario',
        gender,
        birthDate: birthDate || undefined,
        createdAt: Date.now(),
        onboardingCompleted: true,
        privacyAcceptedAt: Date.now(),
      });
      await refreshProfile();
      navigate('/', { replace: true });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6">
      <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[400px] w-[400px] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center animate-slide-up">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Activity className="h-7 w-7 text-primary" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gradient mb-1">Trainlog</h1>

        <div className="mt-2 mb-8 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step ? 'w-8 bg-primary' : s < step ? 'w-4 bg-primary/40' : 'w-4 bg-border'
              }`}
            />
          ))}
        </div>

        <div className="w-full rounded-2xl border border-border/50 bg-card/60 p-6 shadow-lg backdrop-blur-xl">
          {step === 1 && (
            <div className="flex flex-col gap-5 animate-fade-in">
              <div>
                <h2 className="text-lg font-bold text-foreground">¿Cómo te llamamos?</h2>
                <p className="mt-1 text-sm text-muted-foreground">Cuéntanos un poco sobre ti para personalizar tu experiencia.</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha de nacimiento</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Género</label>
                <div className="grid grid-cols-2 gap-2">
                  {GENDER_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setGender(opt.value)}
                      className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition-all ${
                        gender === opt.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border/50 text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => setStep(2)}
                className="mt-2 w-full rounded-xl py-5 font-semibold"
                disabled={!name.trim()}
              >
                Siguiente
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5 animate-fade-in">
              <div>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-foreground">Tu privacidad importa</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Trainlog guarda tus reflexiones deportivas de forma segura. Solo tú puedes ver tus datos.
                </p>
              </div>

              <div className="rounded-xl border border-border/40 bg-muted/30 p-4 text-xs text-muted-foreground space-y-2">
                <p>📝 <strong>Qué guardamos:</strong> nombre, género, edad, notas de voz transcritas y análisis generados por IA.</p>
                <p>🔒 <strong>Para qué:</strong> personalizar tu experiencia y mostrarte contenido relevante.</p>
                <p>🚫 <strong>Lo que no hacemos:</strong> vender tus datos ni compartirlos con terceros.</p>
                <p>🗑️ <strong>Tu control:</strong> puedes exportar o eliminar todos tus datos desde tu perfil en cualquier momento.</p>
              </div>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
                />
                <span className="text-sm text-foreground/80">
                  He leído y acepto la{' '}
                  <Link to="/privacy" target="_blank" className="text-primary underline hover:text-primary/80">
                    Política de Privacidad
                  </Link>{' '}
                  y los{' '}
                  <Link to="/terms" target="_blank" className="text-primary underline hover:text-primary/80">
                    Términos de Uso
                  </Link>
                </span>
              </label>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl py-5 border-border/50"
                >
                  Atrás
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!privacyAccepted}
                  className="flex-1 rounded-xl py-5 font-semibold"
                >
                  Aceptar
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center gap-5 py-2 animate-fade-in text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-4xl">
                🎉
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">¡Todo listo, {name}!</h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  Tu diario de reflexión deportiva está configurado. Graba tu primer entrenamiento cuando quieras.
                </p>
              </div>
              <Button
                onClick={handleFinish}
                disabled={isSaving}
                className="mt-2 w-full rounded-xl py-5 font-semibold"
              >
                {isSaving ? 'Guardando...' : 'Empezar a entrenar'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
