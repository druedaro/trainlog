import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { RecentEntries } from '@/features/journal/RecentEntries';
import { useAuth } from '@/features/auth/useAuth';
import * as firestore from '@/lib/firestore';

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/firestore', () => ({
  fetchRecentEntries: vi.fn(),
}));

describe('Feature: Recent Entries', () => {
  it('shows empty state when there are no recent entries', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: '123' } } as any);
    vi.mocked(firestore.fetchRecentEntries).mockResolvedValue([]);

    render(
      <BrowserRouter>
        <RecentEntries />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/¡Hola! Bienvenido a Trainlog/i)).toBeInTheDocument();
    });
  });

  it('shows recent entries list when data exists', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: '123' } } as any);
    vi.mocked(firestore.fetchRecentEntries).mockResolvedValue([
      { id: '1', transcript: 'Leg day', analysis: { summary: 'Good workout' }, createdAt: new Date() } as any,
    ]);

    render(
      <BrowserRouter>
        <RecentEntries />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Entradas recientes')).toBeInTheDocument();
    });
  });
});
