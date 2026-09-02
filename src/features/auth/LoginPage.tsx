import { Navigate, Link } from 'react-router';
import { useAuth } from '@/features/auth/useAuth';
import { Button } from '@/components/ui/button';
import { Mic, BrainCircuit, LineChart } from 'lucide-react';

export function LoginPage() {
  const { user, isLoading, signInWithGoogle } = useAuth();

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
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 shadow-inner border border-primary/20">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Z" fill="none" stroke="hsl(172, 66%, 50%)" strokeWidth="1.5"/>
            <path d="M12 8v8M8 12l4-4 4 4" stroke="hsl(172, 66%, 50%)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

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
            <h2 className="mb-1 text-center text-lg font-semibold text-foreground">
              Comienza gratis
            </h2>
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Inicia sesión y transforma tu manera de entrenar
            </p>
            <Button
              onClick={signInWithGoogle}
              className="w-full gap-3 rounded-xl bg-foreground py-6 text-sm font-semibold text-background transition-all hover:bg-foreground/90 active:scale-[0.98]"
              size="lg"
            >
              <GoogleIcon />
              Continuar con Google
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
