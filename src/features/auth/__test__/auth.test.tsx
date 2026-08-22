import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/features/auth/useAuth';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { fetchUserProfile } from '@/lib/firestore';


vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  getAuth: vi.fn(),
}));


vi.mock('@/lib/firestore', () => ({
  fetchUserProfile: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({
  auth: {},
}));

const TestComponent = () => {
  const { user, isLoading, signInWithGoogle, signOut } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {user ? (
        <div>
          <span data-testid="user-id">{user.uid}</span>
          <button onClick={signOut}>Logout</button>
        </div>
      ) : (
        <button onClick={signInWithGoogle}>Login</button>
      )}
    </div>
  );
};

describe('Feature: User Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Scenario: Successful login with existing profile', () => {
    it('Given an unauthenticated user, When they log in, Then they are authenticated and profile loads', async () => {
      
      let authCallback: any;
      vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
        authCallback = callback;
        (callback as Function)(null); 
        return vi.fn();
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      
      expect(screen.getByText('Login')).toBeInTheDocument();

      
      vi.mocked(signInWithPopup).mockImplementation(async () => {
        
        await authCallback({ uid: 'user123' });
        return {} as any;
      });

      
      vi.mocked(fetchUserProfile).mockResolvedValue({
        uid: 'user123',
        name: 'David',
        gender: 'masculino',
        createdAt: 123456789,
      });

      
      fireEvent.click(screen.getByText('Login'));

      
      await waitFor(() => {
        expect(screen.getByTestId('user-id')).toHaveTextContent('user123');
      });
    });
  });

  describe('Scenario: User logs out', () => {
    it('Given an authenticated user, When they click logout, Then their session is cleared', async () => {
      let authCallback: any;
      vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
        authCallback = callback;
        (callback as Function)({ uid: 'user123' }); 
        return vi.fn();
      });

      vi.mocked(fetchUserProfile).mockResolvedValue({
        uid: 'user123',
        name: 'David',
        gender: 'masculino',
        createdAt: 123456789,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      
      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });

      
      vi.mocked(firebaseSignOut).mockImplementation(async () => {
        await authCallback(null);
      });

      fireEvent.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(screen.getByText('Login')).toBeInTheDocument();
        expect(screen.queryByTestId('user-id')).not.toBeInTheDocument();
      });
    });
  });
});
