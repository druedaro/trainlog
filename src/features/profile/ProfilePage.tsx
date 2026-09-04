import { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { LogOut, Download, Activity, Calendar, Flame, Edit2, User, AlertTriangle, Shield, FileText, Bell, BookOpen, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { useAuth } from '@/features/auth/useAuth';
import { calculateStreak, ACHIEVEMENTS } from '@/lib/gamification';
import { requestPushPermissions } from '@/lib/push';
import { OnboardingModal } from '@/features/auth/OnboardingModal';
import { ProfileForm } from './ProfileForm';
import { useProfileQuery, useRecentEntriesQuery, useEntriesCountQuery } from '@/hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { useQueryClient } from '@tanstack/react-query';
import { saveUserProfile } from '@/lib/firestore';

export function ProfilePage() {
  const { user, signOut, deleteAccount } = useAuth();
  const navigate = useNavigate();
  
  const { data: profile, isLoading: isProfileLoading } = useProfileQuery();
  const { data: recentEntries = [], isLoading: isEntriesLoading } = useRecentEntriesQuery(user?.uid, 100);
  const { data: entryCount = 0 } = useEntriesCountQuery();
  
  const isLoading = isProfileLoading || isEntriesLoading;

  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>('default');
  const [isAchievementsModalOpen, setIsAchievementsModalOpen] = useState(false);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [streakDays, setStreakDays] = useState<number[]>([]);
  const [isSavingStreak, setIsSavingStreak] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (profile?.trainingDays) {
      setStreakDays(profile.trainingDays);
    } else {
      setStreakDays([1, 2, 3, 4, 5]);
    }
  }, [profile?.trainingDays]);

  useEffect(() => {
    if (typeof Notification !== 'undefined') {
      setNotificationStatus(Notification.permission);
      
      if (Notification.permission === 'granted' && user) {
        requestPushPermissions(user.uid).catch(() => {});
      }
    }
  }, [user]);

  const stats = useMemo(() => {
    if (recentEntries.length === 0) return null;

    const today = new Date();
    const dates = recentEntries.map(e => e.createdAt.getTime());
    const streak = calculateStreak(dates, profile?.trainingDays);

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



  const displayName = profile?.name || 'Atleta';

  if (isEditing) {
    return <ProfileForm profile={profile || null} onCancel={() => setIsEditing(false)} />;
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col bg-background">
      <header className="glass sticky top-0 z-20 flex items-center justify-between border-b border-border/40 px-5 py-3.5">
        <h1 className="text-lg font-bold text-gradient">Tu Perfil</h1>
        <div className="flex gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} aria-label="Edit Profile" className="h-9 w-9 rounded-xl hover:bg-accent hover:text-accent-foreground text-foreground">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border/40 max-h-[90vh] overflow-y-auto">
            <OnboardingModal forceShow={true} onClose={() => setShowOnboarding(false)} />
          </div>
        </div>
      )}

      <main className="flex-1 px-5 py-6 pb-24 space-y-8 animate-slide-up">

        <section className="text-center space-y-2">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-inner">
            <User className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Hola, {displayName} 👋</h2>
          <p className="text-sm text-muted-foreground">Un resumen de rendimiento</p>
        </section>


        <section>
          <h3 className="mb-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Métricas Globales</h3>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-3xl shadow-sm border border-border/40 bg-card/50 p-4 backdrop-blur-sm transition-all hover:bg-primary/5 hover:border-primary/30 hover:shadow-[0_0_15px_hsl(var(--primary)/0.08)]">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Activity className="h-4 w-4" />
                <span className="text-xs font-medium">Entradas</span>
              </div>
              {isLoading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-semibold text-foreground">{entryCount || 0}</div>}
            </div>
            
            <button 
              onClick={() => setIsStreakModalOpen(true)}
              className="text-left rounded-3xl shadow-sm border border-border/40 bg-card/50 p-4 backdrop-blur-sm transition-all hover:bg-primary/5 hover:border-primary/30 hover:shadow-[0_0_15px_hsl(var(--primary)/0.08)] cursor-pointer"
            >
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-xs font-medium">Racha Activa</span>
                </div>
                <Settings2 className="h-3.5 w-3.5 opacity-50" />
              </div>
              {isLoading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-semibold text-foreground">{stats?.streak || 0} <span className="text-sm font-normal text-muted-foreground">días</span></div>}
            </button>

            <div className="rounded-3xl shadow-sm border border-border/40 bg-card/50 p-4 backdrop-blur-sm transition-all hover:bg-primary/5 hover:border-primary/30 hover:shadow-[0_0_15px_hsl(var(--primary)/0.08)]">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium">Última Sesión</span>
              </div>
              {isLoading ? <Skeleton className="h-7 w-12" /> : <div className="text-2xl font-semibold text-foreground">
                {stats?.daysAgo === 0 ? 'Hoy' : stats?.daysAgo === 1 ? 'Ayer' : stats?.daysAgo !== undefined && stats.daysAgo > 1 ? `Hace ${stats.daysAgo}d` : '--'}
              </div>}
            </div>

            <div className="rounded-3xl shadow-sm border border-border/40 bg-card/50 p-4 backdrop-blur-sm transition-all hover:bg-primary/5 hover:border-primary/30 hover:shadow-[0_0_15px_hsl(var(--primary)/0.08)]">
              <div className="flex items-center gap-2 text-muted-foreground mb-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium">Actividad Frecuente</span>
              </div>
              {isLoading ? <Skeleton className="h-7 w-12" /> : <div className="text-lg font-semibold truncate text-foreground" title={stats?.topActivity}>{stats?.topActivity || '--'}</div>}
            </div>
          </div>
        </section>


        <section className="rounded-3xl shadow-sm border border-border/40 bg-card/50 overflow-hidden hover:shadow-[0_0_15px_hsl(var(--primary)/0.08)] transition-shadow">
          <button 
            onClick={() => setIsAchievementsModalOpen(true)}
            className="w-full flex items-center justify-between p-5 hover:bg-primary/5 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">Mis Logros y Trofeos</h3>
                <p className="text-xs text-muted-foreground">
                  {isLoading ? 'Cargando...' : `${profile?.achievements?.length || 0} desbloqueados`}
                </p>
              </div>
            </div>
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">Ver todos</span>
          </button>
        </section>


        <section className="rounded-3xl shadow-sm border border-border/40 bg-card/50 overflow-hidden">
          <Link to="/privacy" className="flex items-center gap-3 p-5 hover:bg-primary/5 transition-colors">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">Política de Privacidad</h3>
              <p className="text-xs text-muted-foreground">Cómo protegemos tus datos</p>
            </div>
          </Link>
          <div className="h-[1px] bg-border/40 mx-4" />
          <Link to="/terms" className="flex items-center gap-3 p-5 hover:bg-primary/5 transition-colors">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">Términos del Servicio</h3>
              <p className="text-xs text-muted-foreground">Condiciones de uso</p>
            </div>
          </Link>
          <div className="h-[1px] bg-border/40 mx-4" />
          <button 
            onClick={() => setShowOnboarding(true)}
            className="w-full flex items-center justify-between p-5 hover:bg-primary/5 hover:border-primary/30 transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">Ver Tutorial</h3>
                <p className="text-xs text-muted-foreground">Revisita el onboarding inicial</p>
              </div>
            </div>
          </button>
        </section>


        <section className="space-y-3">
          <h3 className="mb-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sistema</h3>
          
          <Button 
            variant="outline" 
            className="w-full justify-between h-12 rounded-xl text-foreground bg-card hover:bg-accent border-border/40"
            disabled={notificationStatus === 'granted'}
            onClick={async () => {
              if (user) {
                const granted = await requestPushPermissions(user.uid);
                if (granted) {
                  setNotificationStatus('granted');
                  toast.success('Notificaciones activadas. Recibirás recordatorios diarios.');
                } else {
                  setNotificationStatus(Notification.permission);
                  toast.error('No se pudieron activar las notificaciones. Comprueba los permisos del navegador.');
                }
              }
            }}
          >
            <div className="flex items-center">
              <Bell className={`mr-3 h-4 w-4 ${notificationStatus === 'granted' ? 'text-primary' : notificationStatus === 'denied' ? 'text-destructive' : 'text-blue-500'}`} />
              Activar Notificaciones
            </div>
            {notificationStatus === 'granted' && (
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-md">Activadas</span>
            )}
            {notificationStatus === 'denied' && (
              <span className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-md">Bloqueadas</span>
            )}
          </Button>

          <Button 
            variant="outline" 
            className="w-full justify-start h-12 rounded-xl text-foreground bg-card hover:bg-accent border-border/40"
            onClick={handleExport}
            disabled={!recentEntries.length}
          >
            <Download className="mr-3 h-4 w-4 text-green-500" />
            Exportar mis datos (JSON)
          </Button>

          <Button 
            variant="outline" 
            className="w-full justify-start h-12 rounded-xl text-destructive bg-destructive/5 hover:bg-destructive/10 border-destructive/20"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            <AlertTriangle className="mr-3 h-4 w-4" />
            Borrar cuenta y datos
          </Button>
        </section>

      </main>


      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm space-y-6 rounded-3xl bg-card p-6 shadow-2xl border border-destructive/20">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold text-foreground">¿Estás seguro?</h3>
              <p className="text-sm text-muted-foreground">
                Esta acción eliminará permanentemente tu cuenta, perfil y todas tus entradas. No se puede deshacer.
              </p>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1 rounded-xl"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    await deleteAccount();
                    navigate('/login');
                  } catch (e) {
                    toast.error('No se pudo borrar la cuenta. Por seguridad, debes iniciar sesión de nuevo antes de borrarla.');
                    setIsDeleteModalOpen(false);
                  } finally {
                    setIsDeleting(false);
                  }
                }}
              >
                {isDeleting ? 'Borrando...' : 'Sí, borrar'}
              </Button>
            </div>
          </div>
        </div>
      )}


      {isAchievementsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm sm:p-4 animate-in fade-in">
          <div className="w-full sm:max-w-md bg-card sm:rounded-3xl rounded-t-3xl shadow-2xl border border-border/40 max-h-[85vh] flex flex-col slide-in-from-bottom-full sm:slide-in-from-bottom-0">
            <div className="p-5 border-b border-border/40 flex items-center justify-between sticky top-0 bg-card z-10 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                  <Flame className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg text-foreground">Tus Logros</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsAchievementsModalOpen(false)} className="rounded-full h-8 w-8 p-0">
                ✕
              </Button>
            </div>
            
            <div className="overflow-y-auto p-5 space-y-4">
              {Object.entries(ACHIEVEMENTS).map(([id, ach]) => {
                const isUnlocked = profile?.achievements?.includes(id);
                return (
                  <div key={id} className={`flex gap-4 p-4 rounded-2xl border transition-colors ${
                    isUnlocked 
                      ? 'bg-primary/5 border-primary/20 shadow-sm' 
                      : 'bg-card/50 border-border/30 opacity-60 grayscale'
                  }`}>
                    <div className="text-3xl mt-1">{ach.icon}</div>
                    <div>
                      <h4 className={`font-bold text-sm ${isUnlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {ach.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 leading-snug">
                        {ach.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {isStreakModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm sm:p-4 animate-in fade-in">
          <div className="w-full sm:max-w-md bg-card sm:rounded-3xl rounded-t-3xl shadow-2xl border border-border/40 flex flex-col slide-in-from-bottom-full sm:slide-in-from-bottom-0">
            <div className="p-5 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500">
                  <Settings2 className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-lg text-foreground">Configurar Racha</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => {
                setIsStreakModalOpen(false);
                setStreakDays(profile?.trainingDays || [1, 2, 3, 4, 5]);
              }} className="rounded-full h-8 w-8 p-0">
                ✕
              </Button>
            </div>
            
            <div className="p-5 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">¿Qué días sueles entrenar?</label>
                <p className="text-[11px] text-muted-foreground/80 mb-3">
                  Si descansas un día que no está marcado aquí, mantendrás tu racha sin penalizaciones.
                </p>
                <div className="flex justify-between gap-1">
                  {[
                    { id: 1, label: 'L' },
                    { id: 2, label: 'M' },
                    { id: 3, label: 'X' },
                    { id: 4, label: 'J' },
                    { id: 5, label: 'V' },
                    { id: 6, label: 'S' },
                    { id: 0, label: 'D' },
                  ].map((day) => (
                    <button
                      key={day.id}
                      onClick={() => {
                        setStreakDays(prev => 
                          prev.includes(day.id) 
                            ? prev.filter(d => d !== day.id) 
                            : [...prev, day.id]
                        );
                      }}
                      className={`w-10 h-10 rounded-full text-xs font-semibold flex items-center justify-center transition-all ${
                        streakDays.includes(day.id)
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-accent text-muted-foreground hover:bg-accent/80'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                className="w-full rounded-xl p-6 font-semibold"
                disabled={isSavingStreak}
                onClick={async () => {
                  if (!user) return;
                  setIsSavingStreak(true);
                  try {
                    await saveUserProfile(user.uid, { trainingDays: streakDays });
                    await queryClient.invalidateQueries({ queryKey: ['profile', user.uid] });
                    toast.success('Racha configurada correctamente');
                    setIsStreakModalOpen(false);
                  } catch (e) {
                    toast.error('Error al guardar');
                  } finally {
                    setIsSavingStreak(false);
                  }
                }}
              >
                {isSavingStreak ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
