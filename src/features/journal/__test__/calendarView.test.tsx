import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { CalendarView } from '@/features/journal/CalendarView';
import { useAuth } from '@/features/auth/useAuth';
import * as firestore from '@/lib/firestore';

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/firestore', () => ({
  fetchEntriesByMonth: vi.fn(),
  fetchRecentEntries: vi.fn(),
}));

describe('Feature: Calendar View', () => {
  it('Given an authenticated user with no entries, When Calendar is loaded, Then it shows empty state', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: '123' } } as any);
    vi.mocked(firestore.fetchEntriesByMonth).mockResolvedValue([]);
    vi.mocked(firestore.fetchRecentEntries).mockResolvedValue([]);

    render(
      <BrowserRouter>
        <CalendarView />
      </BrowserRouter>
    );

    // Initial loading
    expect(screen.getByText('Cargando entradas…')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/¡Hola! Bienvenido a Trainlog/i)).toBeInTheDocument();
    });
  });

  it('Given an authenticated user with entries, When Calendar is loaded, Then it shows recent entries', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: '123' } } as any);
    vi.mocked(firestore.fetchEntriesByMonth).mockResolvedValue([]);
    vi.mocked(firestore.fetchRecentEntries).mockResolvedValue([
      { id: '1', transcript: 'Leg day', analysis: { summary: 'Good workout' }, createdAt: new Date() } as any,
    ]);

    render(
      <BrowserRouter>
        <CalendarView />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Entradas recientes')).toBeInTheDocument();
    });
  });
});
