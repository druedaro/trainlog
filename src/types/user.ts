export type Gender = 'masculino' | 'femenino' | 'otro' | 'prefiero no decirlo';

export interface UserProfile {
  uid: string;
  name: string;
  gender: Gender;
  age?: number;
  birthDate?: string;
  createdAt: number;
  onboardingCompleted?: boolean;
  achievements?: string[];
}
