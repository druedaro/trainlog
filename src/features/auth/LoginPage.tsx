import { Navigate, Link } from 'react-router';
import { useAuth } from '@/features/auth/useAuth';
import { Button } from '@/components/ui/button';

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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6">
      <div className="pointer-events-none absolute left-1/2 top-1/3 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[300px] w-[300px] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center animate-slide-up">
        <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Z" fill="none" stroke="hsl(172, 66%, 50%)" strokeWidth="1.5"/>
            <path d="M12 8v8M8 12l4-4 4 4" stroke="hsl(172, 66%, 50%)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-gradient">
          Trainlog
        </h1>
        <p className="mt-2 text-base text-muted-foreground">
          Tu diario personal de reflexión deportiva
        </p>

        <div className="mt-10 w-full max-w-sm rounded-2xl border border-border/50 bg-card/60 p-6 shadow-lg backdrop-blur-xl">
          <h2 className="mb-1 text-center text-lg font-semibold text-foreground">
            Bienvenido
          </h2>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Inicia sesión para empezar a registrar tus reflexiones
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

        <p className="mt-8 text-center text-xs text-muted-foreground/60">
          Al continuar, aceptas nuestros{' '}
          <Link to="/terms" className="underline hover:text-muted-foreground transition-colors">
            Términos de Uso
          </Link>{' '}
          y nuestra{' '}
          <Link to="/privacy" className="underline hover:text-muted-foreground transition-colors">
            Política de Privacidad
          </Link>
        </p>
      </div>
    </div>
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
