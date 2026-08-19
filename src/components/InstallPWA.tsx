import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

export function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-80 glass z-50 p-4 rounded-2xl flex items-center gap-4 animate-slide-up border border-border/40 shadow-xl">
      <div className="flex-1">
        <p className="font-bold text-sm text-foreground">Instalar Trainlog</p>
        <p className="text-xs text-muted-foreground">Añade la app a tu pantalla de inicio para acceso rápido.</p>
      </div>
      <Button onClick={handleInstall} size="sm" className="rounded-xl px-4 font-bold">
        <Download className="w-4 h-4 mr-1.5" />
        Instalar
      </Button>
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute -top-2 -right-2 bg-muted text-muted-foreground hover:text-foreground rounded-full p-1 border border-border/40"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
