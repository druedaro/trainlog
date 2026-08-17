export type Gender = 'masculino' | 'femenino' | 'otro' | 'prefiero no decirlo';

export interface UserProfile {
  uid: string;
  name: string;
  gender: Gender;
  birthDate?: string;
  createdAt: number;
  onboardingCompleted?: boolean;
  privacyAcceptedAt?: number;
}
