import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Battery, Activity, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JournalInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JournalInstructionsModal({ isOpen, onClose }: JournalInstructionsModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-card border-t sm:border border-border/40 sm:rounded-3xl rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-4 duration-300">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-background/50 backdrop-blur z-10"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </Button>

        <div className="flex items-center gap-3 mb-6 pr-8">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground leading-tight">Tips para tu Diario</h2>
            <p className="text-xs text-muted-foreground">Ayuda a tu coach a entenderte mejor</p>
          </div>
        </div>

        <div className="space-y-5">
          <p className="text-sm text-foreground/90 leading-relaxed">
            Trainlog analiza tus audios para generar las métricas de tu página de <strong className="text-primary">Insights</strong>. No necesitas hablar perfecto, pero para sacarle el máximo partido, intenta mencionar estos detalles:
          </p>

          <div className="grid gap-3">
            <div className="flex gap-3 items-start bg-background/50 p-3 rounded-2xl border border-border/30">
              <Battery className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Energía y Ánimo</p>
                <p className="text-xs text-muted-foreground mt-0.5">"Hoy he dormido 8 horas y venía con mucha energía" o "Estaba muy cansado del trabajo y estresado".</p>
              </div>
            </div>

            <div className="flex gap-3 items-start bg-background/50 p-3 rounded-2xl border border-border/30">
              <Activity className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Intensidad y Rendimiento</p>
                <p className="text-xs text-muted-foreground mt-0.5">"Subí a 80kg en press banca" o "El entrenamiento de piernas fue durísimo".</p>
              </div>
            </div>

            <div className="flex gap-3 items-start bg-background/50 p-3 rounded-2xl border border-border/30">
              <Flame className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Molestias o Lesiones</p>
                <p className="text-xs text-muted-foreground mt-0.5">"Noté un pinchazo en la rodilla al bajar" o "La zona lumbar me molestaba mucho".</p>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-primary/10 border border-primary/20 rounded-2xl p-4">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">💡 Ejemplo ideal</p>
            <p className="text-sm italic text-foreground/80">
              "Hoy estaba un poco bajo de energía porque dormí mal, pero el entreno de pecho ha ido genial. He subido a 90kg. Eso sí, al final me ha dado una molestia en el hombro derecho al hacer aperturas."
            </p>
          </div>
        </div>

        <Button onClick={onClose} className="w-full mt-5 rounded-xl font-bold py-5">
          ¡Entendido!
        </Button>
      </div>
    </div>,
    document.body
  );
}
