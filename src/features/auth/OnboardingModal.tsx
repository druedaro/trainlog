import { useAuth } from '@/features/auth/useAuth';
import { useProfileQuery } from '@/hooks/useQueries';
import { OnboardingForm } from './OnboardingForm';

interface OnboardingModalProps {
  forceShow?: boolean;
  onClose?: () => void;
}

export function OnboardingModal({ forceShow = false, onClose }: OnboardingModalProps = {}) {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfileQuery(user?.uid);
  
  if (isLoading || !user) return null;
  if (!forceShow && profile?.onboardingCompleted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        className="w-full max-w-md overflow-hidden rounded-3xl border border-border/50 bg-background/60 shadow-2xl backdrop-blur-xl animate-scale-in"
      >
        <OnboardingForm user={user} profile={profile || null} forceShow={forceShow} onClose={onClose} />
      </div>
    </div>
  );
}
