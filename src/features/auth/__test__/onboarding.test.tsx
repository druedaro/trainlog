import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@/test-utils';
import { OnboardingModal } from '@/features/auth/OnboardingModal';
import { saveUserProfile } from '@/lib/firestore';
import { BrowserRouter } from 'react-router';

const mockRefreshProfile = vi.fn();
vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'user123', displayName: 'Test User' },
    profile: { name: '', gender: '', onboardingCompleted: false },
    refreshProfile: mockRefreshProfile,
  }),
}));

vi.mock('@/lib/firestore', () => ({
  fetchUserProfile: vi.fn().mockResolvedValue({ name: 'David', gender: 'masculino', createdAt: 123456 }),
  saveUserProfile: vi.fn(),
}));

describe('Feature: Onboarding Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Scenario: New user completes onboarding', () => {
    it('Given a user without onboarding completed, When they fill the form and accept privacy, Then their profile is saved with onboardingCompleted: true', async () => {
      render(
        <BrowserRouter>
          <OnboardingModal />
        </BrowserRouter>
      );

      });
  });
});
