import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { fetchRecentEntries, countUserEntries, saveUserProfile } from '@/lib/firestore';
import { BrowserRouter } from 'react-router';

// Mock Auth
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
      // Mock 3 consecutive days of entries
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
        expect(screen.getAllByText('3')[0]).toBeInTheDocument(); // 3 days streak
        expect(screen.getByText('running')).toBeInTheDocument(); // top activity (appears twice)
        expect(screen.getByText(/David/)).toBeInTheDocument(); // Name is shown in the stats block
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

      // Wait for load
      await waitFor(() => expect(screen.getByText(/David/)).toBeInTheDocument());

      // Click Edit
      fireEvent.click(screen.getByLabelText('Edit Profile'));

      // Should be in edit mode
      expect(screen.getByText('Editar Perfil')).toBeInTheDocument();

      // Change name
      const nameInput = screen.getByDisplayValue('David');
      fireEvent.change(nameInput, { target: { value: 'Alex' } });

      // Save
      fireEvent.click(screen.getByText('Guardar'));

      await waitFor(() => {
        expect(saveUserProfile).toHaveBeenCalledWith('user123', expect.objectContaining({
          name: 'Alex',
        }));
        expect(mockRefreshProfile).toHaveBeenCalled();
      });
    });
  });
});
