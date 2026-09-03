import { useState } from 'react';
import { Navigate, Link } from 'react-router';
import { useAuth } from '@/features/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Mic, BrainCircuit, LineChart, Mail, Lock, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const { user, isLoading, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Por favor, rellena todos los campos.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isLoginMode) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Email o contraseña incorrectos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Ya existe una cuenta con este email.');
      } else if (err.code === 'auth/invalid-email') {
        setError('El formato del email no es válido.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('El inicio de sesión por email no está habilitado en Firebase.');
      } else {
        setError('Ocurrió un error inesperado. Inténtalo de nuevo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-12">
      <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[400px] w-[400px] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center animate-slide-up w-full max-w-3xl">
        <img 
          src="/favicon.svg" 
          alt="Trainlog Logo" 
          className="mb-4 h-16 w-16 drop-shadow-sm animate-fade-in"
        />

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gradient text-center mb-3">
          Trainlog
        </h1>
        <p className="text-lg text-muted-foreground text-center max-w-md mx-auto mb-10">
          El primer diario de reflexión deportiva impulsado por voz e inteligencia artificial.
        </p>

        <div className="flex flex-col-reverse md:flex-col w-full items-center gap-10 w-full">
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-card/40 border border-border/40 backdrop-blur-sm">
              <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary">
                <Mic className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">1. Graba</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Habla naturalmente sobre tu entreno. Sin menús complicados, solo tu voz.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-card/40 border border-border/40 backdrop-blur-sm">
              <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">2. Analiza</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Nuestra IA transcribe y extrae métricas de fatiga, actividades y estado de ánimo.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-card/40 border border-border/40 backdrop-blur-sm">
              <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary">
                <LineChart className="h-6 w-6" />
              </div>
              <h3 className="text-base font-bold text-foreground mb-1">3. Descubre</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Revisa tu progreso en el calendario y recibe artículos hiper-personalizados.
              </p>
            </div>
          </div>

          <div className="w-full max-w-sm rounded-3xl border border-border/50 bg-card/80 p-6 shadow-2xl backdrop-blur-xl">
            <h2 className="mb-1 text-center text-xl font-bold text-foreground">
              {isLoginMode ? 'Inicia sesión' : 'Crea tu cuenta'}
            </h2>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              {isLoginMode ? 'Y sigue transformando tu entreno' : 'Únete y empieza gratis hoy mismo'}
            </p>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mb-4 space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="Tu correo electrónico"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-input bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-input bg-transparent py-2.5 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl py-6 font-semibold transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                ) : (
                  isLoginMode ? 'Entrar' : 'Registrarse'
                )}
              </Button>
            </form>

            <div className="mb-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setError(null);
                }}
                className="text-sm text-primary hover:underline"
              >
                {isLoginMode ? '¿No tienes cuenta? Regístrate gratis' : '¿Ya tienes cuenta? Inicia sesión'}
              </button>
            </div>

            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">O continuar con</span>
              </div>
            </div>

            <Button
              type="button"
              onClick={signInWithGoogle}
              variant="outline"
              disabled={isSubmitting}
              className="w-full gap-3 rounded-xl py-6 text-sm font-semibold transition-all hover:bg-muted active:scale-[0.98]"
            >
              <GoogleIcon />
              Google
            </Button>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Al continuar, aceptas nuestros{' '}
          <Link to="/terms" className="underline hover:text-foreground transition-colors">
            Términos de Uso
          </Link>{' '}
          y nuestra{' '}
          <Link to="/privacy" className="underline hover:text-foreground transition-colors">
            Política de Privacidad
          </Link>
        </p>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}
