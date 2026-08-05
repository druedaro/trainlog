export type Gender = 'masculino' | 'femenino' | 'prefiero no decirlo';

export interface UserProfile {
  uid: string;
  name: string;
  gender: Gender;
  birthDate?: string;
  createdAt: number;
}
