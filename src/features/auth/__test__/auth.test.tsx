import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/features/auth/useAuth';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { fetchUserProfile } from '@/lib/firestore';

// Mock Firebase Auth
vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  GoogleAuthProvider: vi.fn(),
  getAuth: vi.fn(),
}));

// Mock Firestore
vi.mock('@/lib/firestore', () => ({
  fetchUserProfile: vi.fn(),
}));

vi.mock('@/lib/firebase', () => ({
  auth: {},
}));

const TestComponent = () => {
  const { user, profile, isLoading, signInWithGoogle, signOut } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {user ? (
        <div>
          <span data-testid="user-id">{user.uid}</span>
          <span data-testid="profile-name">{profile?.name || 'No Profile'}</span>
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
      // Setup initial state: not logged in
      let authCallback: any;
      vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
        authCallback = callback;
        (callback as Function)(null); // Initially null
        return vi.fn();
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Verify unauthenticated state
      expect(screen.getByText('Login')).toBeInTheDocument();

      // Mock the login action
      vi.mocked(signInWithPopup).mockImplementation(async () => {
        // Simulate Firebase auth state change
        await authCallback({ uid: 'user123' });
        return {} as any;
      });

      // Mock profile fetch
      vi.mocked(fetchUserProfile).mockResolvedValue({
        uid: 'user123',
        name: 'David',
        gender: 'masculino',
        createdAt: 123456789,
      });

      // User clicks login
      fireEvent.click(screen.getByText('Login'));

      // Verify authenticated state
      await waitFor(() => {
        expect(screen.getByTestId('user-id')).toHaveTextContent('user123');
        expect(screen.getByTestId('profile-name')).toHaveTextContent('David');
      });
    });
  });

  describe('Scenario: User logs out', () => {
    it('Given an authenticated user, When they click logout, Then their session is cleared', async () => {
      let authCallback: any;
      vi.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
        authCallback = callback;
        (callback as Function)({ uid: 'user123' }); // Start logged in
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

      // Wait for load
      await waitFor(() => {
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });

      // Mock the logout action
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
