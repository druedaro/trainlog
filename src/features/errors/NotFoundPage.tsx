import { Link } from 'react-router';
import { Button } from '@/components/ui/button';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-12 text-center">
      {/* Background gradients */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[400px] w-[400px] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center animate-slide-up w-full max-w-md">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-inner border border-primary/20 backdrop-blur-sm">
          <FileQuestion className="h-12 w-12" />
        </div>
        
        <h1 className="mb-3 text-5xl md:text-7xl font-extrabold tracking-tight text-gradient">
          404
        </h1>
        
        <h2 className="mb-4 text-2xl font-bold text-foreground">
          Página no encontrada
        </h2>
        
        <p className="mb-10 text-lg text-muted-foreground leading-relaxed">
          Parece que te has perdido. La página que buscas no existe o ha sido movida a otro lugar.
        </p>

        <Button asChild className="w-full gap-2 rounded-xl py-6 font-semibold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]">
          <Link to="/">
            <ArrowLeft className="h-5 w-5" />
            Volver al inicio
          </Link>
        </Button>
      </div>
    </main>
  );
}
