import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, LogOut, User, Activity, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';
import { countUserEntries } from '@/lib/firestore';

export function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [entryCount, setEntryCount] = useState<number | null>(null);

  useEffect(() => {
    if (user) {
      countUserEntries(user.uid)
        .then((count) => setEntryCount(count))
        .catch((e) => console.error('Failed to load entry count', e));
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-background">
      {/* Header */}
      <header className="glass sticky top-0 z-20 border-b border-border/40 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label="Back"
            className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">Profile</h1>
        </div>
      </header>

      <main className="flex-1 px-5 py-8 space-y-8 animate-slide-up">
        {/* User Info */}
        <section className="flex flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shadow-inner">
            <User className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Athlete</h2>
          <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-border/40 bg-card/50 p-5 text-center backdrop-blur-sm">
            <Activity className="mx-auto mb-2 h-6 w-6 text-emerald-400" />
            <p className="text-3xl font-bold text-foreground">
              {entryCount !== null ? entryCount : '-'}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Entries
            </p>
          </div>
          <div className="rounded-2xl border border-border/40 bg-card/50 p-5 text-center backdrop-blur-sm">
            <Flame className="mx-auto mb-2 h-6 w-6 text-amber-400" />
            <p className="text-3xl font-bold text-foreground">
              {entryCount !== null ? (entryCount > 0 ? 'Active' : 'New') : '-'}
            </p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Status
            </p>
          </div>
        </section>

        {/* Actions */}
        <section className="pt-6 border-t border-border/40 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">Account</h3>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start gap-3 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive px-4 py-6"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-base font-semibold">Sign out</span>
          </Button>
        </section>
      </main>
    </div>
  );
}
