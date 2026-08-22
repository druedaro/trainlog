import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';
import { MemoryRouter, Routes, Route } from 'react-router';
import { DayEntriesPage } from '@/features/journal/DayEntriesPage';
import { useAuth } from '@/features/auth/useAuth';
import * as firestore from '@/lib/firestore';

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/firestore', () => ({
  fetchUserProfile: vi.fn().mockResolvedValue({ name: 'David', gender: 'masculino', createdAt: 123456 }),
  fetchEntriesByDays: vi.fn(),
  fetchEntriesByDay: vi.fn(),
}));

describe('Feature: Day Entries Page', () => {
  it('Given a date, When navigating to day entries, Then it shows a list of entries for that day', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: '123' } } as any);
    
    vi.mocked(firestore.fetchEntriesByDay).mockResolvedValue([
      {
        id: 'entry1',
        transcript: 'First workout of the day',
        analysis: { summary: 'Morning run' },
        createdAt: new Date('2024-01-01T08:00:00Z'),
      },
      {
        id: 'entry2',
        transcript: 'Second workout of the day',
        analysis: { summary: 'Evening lift' },
        createdAt: new Date('2024-01-01T18:00:00Z'),
      },
    ] as any);

    render(
      <MemoryRouter initialEntries={['/day/2024-01-01']}>
        <Routes>
          <Route path="/day/:date" element={<DayEntriesPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Morning run/i)).toBeInTheDocument();
      expect(screen.getByText(/Evening lift/i)).toBeInTheDocument();
    });
  });
});
