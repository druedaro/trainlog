import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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

      expect(screen.getByText('¿Cómo te llamas?')).toBeInTheDocument();
      
      const nameInput = screen.getByPlaceholderText('Tu nombre o apodo');
      fireEvent.change(nameInput, { target: { value: 'David' } });

      const ageInput = screen.getByPlaceholderText('Ej. 28');
      fireEvent.change(ageInput, { target: { value: '25' } });

      const genderSelect = screen.getByDisplayValue('¿Cuál es tu género?');
      fireEvent.change(genderSelect, { target: { value: 'masculino' } });

      fireEvent.click(screen.getByText('Continuar'));

      await waitFor(() => {
        expect(screen.getByText('Acepto la política de privacidad')).toBeInTheDocument();
      });

      const privacyCheckbox = screen.getByLabelText('Acepto la política de privacidad');
      fireEvent.click(privacyCheckbox);

      fireEvent.click(screen.getByText('Empezar mi diario'));

      await waitFor(() => {
        expect(saveUserProfile).toHaveBeenCalledWith('user123', expect.objectContaining({
          name: 'David',
          age: 25,
          gender: 'masculino',
          onboardingCompleted: true
        }));
        expect(mockRefreshProfile).toHaveBeenCalled();
      });
    });
  });
});
