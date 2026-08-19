import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { fetchRecentEntries, countUserEntries, saveUserProfile } from '@/lib/firestore';
import { BrowserRouter } from 'react-router';


const mockRefreshProfile = vi.fn();
vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({
    user: { uid: 'user123' },
    profile: { name: 'David', gender: 'masculino', createdAt: 123456 },
    isLoading: false,
    signInWithGoogle: vi.fn(),
    signOut: vi.fn(),
    refreshProfile: mockRefreshProfile,
  }),
}));
vi.mock('@/lib/firestore', () => ({
  fetchRecentEntries: vi.fn(),
  countUserEntries: vi.fn(),
  saveUserProfile: vi.fn(),
}));

describe('Feature: User Profile Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Scenario: Viewing profile metrics', () => {
    it('Given a user with continuous training history, When they view the profile, Then they see their streak and top activity', async () => {
      
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const dayBefore = new Date(today);
      dayBefore.setDate(dayBefore.getDate() - 2);

      const mockEntries = [
        { id: '1', createdAt: today, analysis: { activities: ['running'] } },
        { id: '2', createdAt: yesterday, analysis: { activities: ['running', 'strength'] } },
        { id: '3', createdAt: dayBefore, analysis: { activities: ['strength'] } },
      ];

      vi.mocked(fetchRecentEntries).mockResolvedValue(mockEntries as any);
      vi.mocked(countUserEntries).mockResolvedValue(3);

      render(
        <BrowserRouter>
          <ProfilePage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getAllByText('3')[0]).toBeInTheDocument(); 
        expect(screen.getByText('running')).toBeInTheDocument(); 
        expect(screen.getByText(/David/)).toBeInTheDocument(); 
      });
    });
  });

  describe('Scenario: Editing profile', () => {
    it('Given a loaded profile, When the user updates their name, Then the data is saved', async () => {
      vi.mocked(fetchRecentEntries).mockResolvedValue([]);
      vi.mocked(countUserEntries).mockResolvedValue(0);

      render(
        <BrowserRouter>
          <ProfilePage />
        </BrowserRouter>
      );

      
      await waitFor(() => expect(screen.getByText(/David/)).toBeInTheDocument());

      
      fireEvent.click(screen.getByLabelText('Edit Profile'));

      
      expect(screen.getByText('Editar Perfil')).toBeInTheDocument();

      
      const nameInput = screen.getByDisplayValue('David');
      fireEvent.change(nameInput, { target: { value: 'Alex' } });

      const ageInput = screen.getByPlaceholderText('Ej. 28');
      fireEvent.change(ageInput, { target: { value: '30' } });

      const genderSelect = screen.getByDisplayValue('Hombre');
      fireEvent.change(genderSelect, { target: { value: 'otro' } });

      
      fireEvent.click(screen.getByText('Guardar'));

      await waitFor(() => {
        expect(saveUserProfile).toHaveBeenCalledWith('user123', expect.objectContaining({
          name: 'Alex',
          age: 30,
          gender: 'otro'
        }));
        expect(mockRefreshProfile).toHaveBeenCalled();
      });
    });
  });
});
