import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { InsightsPage } from '@/features/insights/InsightsPage';
import { useAuth } from '@/features/auth/useAuth';
import { fetchInsights, fetchRecentEntries, fetchEntriesByDays } from '@/lib/firestore';

// Mock Auth
vi.mock('@/features/auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock Firestore
vi.mock('@/lib/firestore', () => ({
  fetchInsights: vi.fn(),
  fetchRecentEntries: vi.fn(),
  fetchEntriesByDays: vi.fn(),
  saveInsights: vi.fn(),
}));

// Mock Recharts to prevent rendering issues in JSDOM
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: () => <div data-testid="line-chart" />,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
  ReferenceLine: () => null,
}));

describe('Feature: Weekly Insights Synthesis', () => {
  const mockUser = { uid: 'user123' };
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser as any,
      profile: null as any,
      isLoading: false,
      signInWithGoogle: vi.fn(),
      signOut: vi.fn(),
      refreshProfile: vi.fn(),
    });
  });

  describe('Scenario: Generating insights with insufficient data', () => {
    it('Given a user with 0 recent entries, When they tap generate synthesis, Then an error message explains the business rule', async () => {
      vi.mocked(fetchRecentEntries).mockResolvedValue([]);
      vi.mocked(fetchEntriesByDays).mockResolvedValue([]);
      vi.mocked(fetchInsights).mockResolvedValue(null);

      render(<InsightsPage />);

      // Wait for initial load to finish
      await waitFor(() => {
        expect(screen.getByText('Sin datos esta semana')).toBeInTheDocument();
        expect(screen.getByText('Graba algunas entradas para ver tus patrones.')).toBeInTheDocument();
        expect(screen.queryByText('Analizar semana')).not.toBeInTheDocument();
      });
    });
  });
});
