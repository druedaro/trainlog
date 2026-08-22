import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

let userPromise: Promise<User | null> | null = null;

/**
 * Returns a Promise that resolves with the current Firebase User or null.
 * It waits for the initial auth state to be resolved.
 */
export function requireAuth(): Promise<User | null> {
  if (userPromise) return userPromise;

  userPromise = new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });

  return userPromise;
}
