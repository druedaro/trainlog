import { useState, useRef } from 'react';
import { Mic } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { saveUserProfile } from '@/lib/firestore';
import { type Gender, userProfileSchema, UserProfile } from '@/types/user';
import { useAuth } from '@/features/auth/useAuth';
import { useQueryClient } from '@tanstack/react-query';

export function ProfileForm({ 
  profile, 
  onCancel 
}: { 
  profile: UserProfile | null;
  onCancel: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [editName, setEditName] = useState(profile?.name || '');
  const [editGender, setEditGender] = useState<Gender>(profile?.gender || 'prefiero no decirlo');
  const [editAge, setEditAge] = useState<string>(profile?.age?.toString() || '');
  const [editBirthDate, setEditBirthDate] = useState(profile?.birthDate || '');
  const [editPersonalContext, setEditPersonalContext] = useState(profile?.personalContext || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

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
        setEditPersonalContext(prev => (prev ? prev + ' ' + finalTranscript : finalTranscript));
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

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const profileData = {
        uid: user.uid,
        name: editName.trim() || 'Atleta',
        gender: editGender,
        age: editAge ? parseInt(editAge, 10) : undefined,
        birthDate: editBirthDate || undefined,
        personalContext: editPersonalContext.trim() || undefined,
        createdAt: profile?.createdAt || Date.now()
      };

      const parsed = userProfileSchema.partial().safeParse(profileData);
      if (!parsed.success) {
        toast.error(parsed.error?.errors[0]?.message || 'Error de validación');
        setIsSaving(false);
        return;
      }

      await saveUserProfile(user.uid, parsed.data);
      await queryClient.invalidateQueries({ queryKey: ['profile', user.uid] });
      onCancel();
      toast.success('Perfil guardado con éxito.');
    } catch (e) {
      toast.error('Error al guardar el perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col bg-background p-6 animate-slide-up">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Editar Perfil</h1>
      <div className="space-y-4">
        <div className="relative">
          <label className="text-sm font-semibold text-muted-foreground">Nombre</label>
          <input 
            type="text" 
            maxLength={50}
            value={editName}
            onChange={e => setEditName(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-border/40 bg-card/50 p-3 pr-12 text-foreground"
            placeholder="Ej. David"
          />
          <div className="absolute right-2 top-[34px] text-xs text-muted-foreground">
            {editName.length}/50
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-muted-foreground">Sexo</label>
          <select 
            value={editGender}
            onChange={e => setEditGender(e.target.value as Gender)}
            className="mt-1 block w-full rounded-xl border border-border/40 bg-card/50 p-3 text-foreground"
          >
            <option value="masculino">Hombre</option>
            <option value="femenino">Mujer</option>
            <option value="otro">Otro</option>
            <option value="prefiero no decirlo">Prefiero no decirlo</option>
          </select>
        </div>
        <div>
          <label className="text-sm font-semibold text-muted-foreground">Edad</label>
          <input 
            type="number" 
            value={editAge}
            onChange={e => setEditAge(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-border/40 bg-card/50 p-3 text-foreground"
            placeholder="Ej. 28"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-muted-foreground">Fecha de Nacimiento</label>
          <input 
            type="date" 
            value={editBirthDate}
            onChange={e => setEditBirthDate(e.target.value)}
            className="mt-1 block w-full rounded-xl border border-border/40 bg-card/50 p-3 text-foreground"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex justify-between items-center">
            <span>Contexto Vital (Privado)</span>
          </label>
          <p className="text-xs text-muted-foreground mb-2">
            Explícale a Anna tu situación actual (ej: lesiones, duelo, metas). Lo usará para adaptar su empatía a ti.
          </p>
          <div className="relative">
            <textarea
              maxLength={400}
              value={editPersonalContext}
              onChange={(e) => setEditPersonalContext(e.target.value)}
              className="min-h-[100px] w-full resize-none rounded-xl border border-border/40 bg-card/50 p-3 pb-8 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
              placeholder=""
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
              <div className="text-xs text-muted-foreground">
                {editPersonalContext.length}/400
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-6">
          <Button onClick={onCancel} variant="outline" className="flex-1 rounded-xl">Cancelar</Button>
          <Button onClick={handleSaveProfile} disabled={isSaving} className="flex-1 rounded-xl bg-primary text-primary-foreground">
            {isSaving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
