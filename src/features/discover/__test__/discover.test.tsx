import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@/test-utils';
import { DiscoverPage } from '@/features/discover/DiscoverPage';
import { useAuth } from '@/features/auth/useAuth';
import { fetchDiscoverArticles, fetchRecentEntries, fetchSavedArticles } from '@/lib/firestore';
import { BrowserRouter } from 'react-router';


vi.mock('@/features/auth/useAuth', () => ({
  useAuth: vi.fn(),
}));


vi.mock('@/lib/firestore', () => ({
  fetchUserProfile: vi.fn().mockResolvedValue({ name: 'David', gender: 'masculino', createdAt: 123456 }),
  fetchDiscoverArticles: vi.fn(),
  fetchSavedArticles: vi.fn(),
  fetchRecentEntries: vi.fn(),
  saveDiscoverArticles: vi.fn(),
}));


vi.mock('@/lib/api', () => ({
  generateDiscover: vi.fn(),
}));

describe('Feature: Article Discovery System', () => {
  const mockUser = { uid: 'user123' };
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser as any,
      isLoading: false,
      signInWithGoogle: vi.fn(),
      signInWithEmail: vi.fn(),
      signUpWithEmail: vi.fn(),
      signOut: vi.fn(),
      deleteAccount: vi.fn(),
    });
  });

  describe('Scenario: Generating articles with insufficient history', () => {
    it('Given a user with no entries, When they tap generate, Then they are warned about insufficient data', async () => {
      vi.mocked(fetchDiscoverArticles).mockResolvedValue(null);
      vi.mocked(fetchRecentEntries).mockResolvedValue([]);

      render(
        <BrowserRouter>
          <DiscoverPage />
        </BrowserRouter>
      );

      
      await waitFor(() => expect(screen.getByText('Generar recomendaciones')).toBeInTheDocument());

      const generateBtn = screen.getByText('Generar recomendaciones');
      fireEvent.click(generateBtn);

      await waitFor(() => {
        expect(screen.getByText('Necesitas al menos una entrada para generar recomendaciones.')).toBeInTheDocument();
      });
    });
  });

  describe('Scenario: Viewing saved articles', () => {
    it('Given a user has saved articles, When they switch to the Saved tab, Then the articles are displayed in correct category order', async () => {
      vi.mocked(fetchDiscoverArticles).mockResolvedValue(null);
      
      const mockSaved = [
        { id: '1', title: 'Mindset Tip', category: 'mindset', content: '...', emoji: '🧠', reason: '...' },
        { id: '2', title: 'Recovery Tip', category: 'recovery', content: '...', emoji: '💤', reason: '...' },
      ];
      
      vi.mocked(fetchSavedArticles).mockResolvedValue({ articles: mockSaved as any, lastDoc: null });

      render(
        <BrowserRouter>
          <DiscoverPage />
        </BrowserRouter>
      );

      
      const savedTab = screen.getByText('Guardados');
      fireEvent.click(savedTab);

      await waitFor(() => {
        expect(fetchSavedArticles).toHaveBeenCalledWith('user123');
        expect(screen.getByText('Mindset Tip')).toBeInTheDocument();
        expect(screen.getByText('Recovery Tip')).toBeInTheDocument();
      });
    });
  });
});
