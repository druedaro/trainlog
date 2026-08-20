import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router';
import { LogOut, Download, Activity, Calendar, Flame, Edit2, User, AlertTriangle, Shield, FileText, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useAuth } from '@/features/auth/useAuth';
import { countUserEntries, fetchRecentEntries, saveUserProfile } from '@/lib/firestore';
import { calculateStreak, ACHIEVEMENTS } from '@/lib/gamification';
import { requestPushPermissions } from '@/lib/push';
import type { JournalEntry } from '@/types/entry';
import type { Gender } from '@/types/user';

export function ProfilePage() {
  const { user, profile, signOut, refreshProfile, deleteAccount } = useAuth();
  const navigate = useNavigate();
  
  const [entryCount, setEntryCount] = useState<number | null>(null);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(profile?.name || '');
  const [editGender, setEditGender] = useState<Gender>(profile?.gender || 'prefiero no decirlo');
  const [editAge, setEditAge] = useState<string>(profile?.age?.toString() || '');
  const [editBirthDate, setEditBirthDate] = useState(profile?.birthDate || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setIsLoading(true);
      Promise.all([
        countUserEntries(user.uid),
        fetchRecentEntries(user.uid, 100)
      ])
        .then(([count, entries]) => {
          setEntryCount(count);
          setRecentEntries(entries);
        })
        .catch(() => toast.error('Error al cargar datos del perfil.'))
        .finally(() => setIsLoading(false));
    }
  }, [user]);

  
  const stats = useMemo(() => {
    if (recentEntries.length === 0) return null;

    const today = new Date();
    const dates = recentEntries.map(e => e.createdAt.getTime());
    const streak = calculateStreak(dates);

    
    const activityCounts: Record<string, number> = {};
    recentEntries.forEach(entry => {
      entry.analysis.activities?.forEach(act => {
        const lower = act.toLowerCase();
        activityCounts[lower] = (activityCounts[lower] || 0) + 1;
      });
    });
    
    let topActivity = 'Ninguna';
    let maxCount = 0;
    Object.entries(activityCounts).forEach(([act, count]) => {
      if (count > maxCount) {
        maxCount = count;
        topActivity = act;
      }
    });

    
    const lastEntryDate = recentEntries[0]?.createdAt;
    const daysAgo = lastEntryDate 
      ? Math.max(0, Math.floor((today.getTime() - lastEntryDate.getTime()) / 86400000))
      : -1;

    return { streak, topActivity, daysAgo };
  }, [recentEntries]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleExport = () => {
    if (recentEntries.length === 0) return;
    const dataStr = JSON.stringify(recentEntries, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trainlog_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await saveUserProfile(user.uid, {
        uid: user.uid,
        name: editName.trim() || 'Atleta',
        gender: editGender,
        age: editAge ? parseInt(editAge, 10) : undefined,
        birthDate: editBirthDate || undefined,
        createdAt: profile?.createdAt || Date.now()
      });
      await refreshProfile();
      setIsEditing(false);
      toast.success('Perfil guardado con éxito.');
    } catch (e) {
      toast.error('Error al guardar el perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días';
    if (hour < 20) return '¡Buenas tardes';
    return '¡Buenas noches';
  })();

  const displayName = profile?.name || 'Atleta';

  if (isEditing) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col bg-background p-6">
        <h1 className="text-2xl font-bold mb-6 text-foreground">Editar Perfil</h1>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-muted-foreground">Nombre</label>
            <input 
              type="text" 
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="mt-1 block w-full rounded-xl border border-border/40 bg-card/50 p-3 text-foreground"
              placeholder="Ej. David"
            />
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
          <div className="pt-4 flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(false)}
              className="flex-1 rounded-xl"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="flex-1 rounded-xl bg-primary text-primary-foreground"
            >
              {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col bg-background">
      <header className="glass sticky top-0 z-20 border-b border-border/40 px-5 py-3.5 flex justify-between items-center">
        <h1 className="text-lg font-bold text-gradient">Perfil</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button 
            aria-label="Edit Profile"
            onClick={() => {
              setEditName(profile?.name || '');
              setEditGender(profile?.gender || 'prefiero no decirlo');
              setEditBirthDate(profile?.birthDate || '');
              setIsEditing(true);
            }} 
            className="text-primary p-2"
          >
            <Edit2 className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 px-5 py-8 space-y-8 animate-slide-up pb-24 md:pb-8">
        <section className="flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shadow-inner">
            <User className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{greeting}, {displayName}!</h2>
          <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
        </section>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-8">
              <section className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border/40 bg-card/50 p-5 text-center backdrop-blur-sm">
              <Activity className="mx-auto mb-2 h-6 w-6 text-emerald-400" />
              <p className="text-3xl font-bold text-foreground">
                {entryCount !== null ? entryCount : '-'}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Entradas
              </p>
            </div>
            
            <div className="rounded-2xl border border-border/40 bg-card/50 p-5 text-center backdrop-blur-sm">
              <Flame className="mx-auto mb-2 h-6 w-6 text-amber-400" />
              <p className="text-3xl font-bold text-foreground">
                {stats ? stats.streak : '-'}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Días seguidos
              </p>
            </div>

            <div className="rounded-2xl border border-border/40 bg-card/50 p-5 text-center backdrop-blur-sm">
              <span className="mx-auto mb-2 block text-2xl">🏃‍♂️</span>
              <p className="text-sm sm:text-lg font-bold text-foreground capitalize leading-tight line-clamp-2 px-1 break-words">
                {stats ? stats.topActivity : '-'}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Favorita
              </p>
            </div>

            <div className="rounded-2xl border border-border/40 bg-card/50 p-5 text-center backdrop-blur-sm">
              <Calendar className="mx-auto mb-2 h-6 w-6 text-blue-400" />
              <p className="text-xl font-bold text-foreground">
                {stats ? (stats.daysAgo === 0 ? 'Hoy' : stats.daysAgo === 1 ? 'Ayer' : `Hace ${stats.daysAgo} d.`) : '-'}
              </p>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Última vez
              </p>
            </div>
          </section>

          <section className="pt-8 border-t border-border/40 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">Mis Logros</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.values(ACHIEVEMENTS).map((ach) => {
                const isUnlocked = profile?.achievements?.includes(ach.id);
                return (
                  <div 
                    key={ach.id} 
                    className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all ${
                      isUnlocked 
                        ? 'border-primary/30 bg-primary/5 shadow-sm' 
                        : 'border-border/30 bg-card/20 opacity-60 grayscale'
                    }`}
                  >
                    <span className="text-3xl mb-2">{ach.icon}</span>
                    <p className="text-sm font-bold text-foreground leading-tight mb-1">{ach.title}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{ach.description}</p>
                    {!isUnlocked && (
                      <div className="absolute top-2 right-2 bg-background/80 rounded-full p-1 shadow-sm border border-border/50">
                        <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </section>
            </div>

          <section className="space-y-4 pt-8 md:pt-0 md:border-l md:border-border/40 md:pl-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">Cuenta</h3>
          <Button
            variant="ghost"
            onClick={async () => {
              if (!user) return;
              toast.loading('Solicitando permisos...', { id: 'push' });
              const success = await requestPushPermissions(user.uid);
              if (success) toast.success('Notificaciones activadas', { id: 'push' });
              else toast.error('Permiso denegado', { id: 'push' });
            }}
            className="w-full justify-start gap-3 rounded-xl bg-primary/5 text-foreground hover:bg-primary/10 px-4 py-6 mb-2"
          >
            <Bell className="h-5 w-5" />
            <span className="text-base font-semibold">Activar Notificaciones Push</span>
          </Button>
          <Button
            variant="ghost"
            onClick={handleExport}
            disabled={recentEntries.length === 0}
            className="w-full justify-start gap-3 rounded-xl bg-primary/5 text-foreground hover:bg-primary/10 px-4 py-6"
          >
            <Download className="h-5 w-5" />
            <span className="text-base font-semibold">Exportar mis datos (JSON)</span>
          </Button>

          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2 pt-6">Legal</h3>
          <Link
            to="/privacy"
            className="flex w-full items-center gap-3 rounded-xl bg-card/50 border border-border/40 text-foreground hover:bg-primary/5 px-4 py-4 transition-colors"
          >
            <Shield className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-semibold">Política de Privacidad</span>
          </Link>
          <Link
            to="/terms"
            className="flex w-full items-center gap-3 rounded-xl bg-card/50 border border-border/40 text-foreground hover:bg-primary/5 px-4 py-4 transition-colors"
          >
            <FileText className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm font-semibold">Términos de Uso</span>
          </Link>
          
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive px-4 py-6"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-base font-semibold">Cerrar sesión</span>
          </Button>

          <div className="pt-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-destructive/80 px-2 mb-4">Zona Peligrosa</h3>
            <Button
              variant="ghost"
              onClick={() => setIsDeleteModalOpen(true)}
              className="w-full justify-start gap-3 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive px-4 py-6"
            >
              <AlertTriangle className="h-5 w-5" />
              <span className="text-base font-semibold">Eliminar cuenta</span>
            </Button>
          </div>
            </section>
          </div>
        )}
      </main>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-border/40">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Eliminar cuenta</h2>
            <p className="text-sm text-muted-foreground mb-6">
              ¿Estás seguro de que quieres eliminar tu cuenta y todos tus datos? Esta acción es irreversible.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="flex-1 rounded-xl"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await deleteAccount();
                    toast.success('Cuenta eliminada con éxito.');
                    setIsDeleteModalOpen(false);
                  } catch (e: any) {
                    if (e.code === 'auth/requires-recent-login') {
                      toast.error('Por seguridad, cierra sesión y vuelve a entrar antes de eliminar tu cuenta.');
                    } else {
                      toast.error('Error al eliminar la cuenta. Inténtalo de nuevo.');
                    }
                    setIsDeleteModalOpen(false);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                disabled={isDeleting}
                className="flex-1 rounded-xl"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
