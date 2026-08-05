export type Gender = 'masculino' | 'femenino' | 'otro';

export interface UserProfile {
  uid: string;
  name: string;
  gender: Gender;
  createdAt: number;
}
