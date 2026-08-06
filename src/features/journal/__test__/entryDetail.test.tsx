import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { EntryDetail } from '@/features/journal/EntryDetail';
import { useAuth } from '@/features/auth/useAuth';
import * as firestore from '@/lib/firestore';

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/firestore', () => ({
  fetchEntryById: vi.fn(),
  fetchRecentEntries: vi.fn(),
}));

describe('Feature: Entry Detail', () => {
  it('Given an existing entry ID, When navigating to detail, Then it loads and displays the entry', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: '123' } } as any);
    
    vi.mocked(firestore.fetchRecentEntries).mockResolvedValue([]);
    vi.mocked(firestore.fetchEntryById).mockResolvedValue({
      id: 'abc',
      transcript: 'This is my audio transcript.',
      analysis: {
        summary: 'Good summary',
        themes: [],
        activities: [],
        perceivedEnergy: 'moderate',
        perceivedMood: 'neutral',
        reflectionPrompt: null,
      },
      createdAt: new Date('2024-01-01T10:00:00Z'),
    } as any);

    render(
      <MemoryRouter initialEntries={['/entry/abc']}>
        <Routes>
          <Route path="/entry/:id" element={<EntryDetail />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('This is my audio transcript.')).toBeInTheDocument();
      expect(screen.getByText('Good summary')).toBeInTheDocument();
    });
  });
});
