import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@/test-utils';
import { CoachPage } from '@/features/coach/CoachPage';
import { useAuth } from '@/features/auth/useAuth';
import * as firestore from '@/lib/firestore';

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  sendMessageToCoach: vi.fn(),
}));

vi.mock('@/lib/firestore', () => ({
  fetchUserProfile: vi.fn().mockResolvedValue({ name: 'David', gender: 'masculino', createdAt: 123456 }),
  fetchEntriesByDays: vi.fn(),
  unlockAchievements: vi.fn(),
}));

Object.defineProperty(window, 'speechSynthesis', {
  value: {
    speak: vi.fn(),
    cancel: vi.fn(),
  },
  writable: true
});

describe('Feature: Coach Chat', () => {
  it('Given an authenticated user, When sending a message, Then it adds it to the chat', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: '123' }, profile: { displayName: 'John' } } as any);
    
    vi.mocked(firestore.fetchEntriesByDays).mockResolvedValue([{ id: '1', transcript: 'test' }] as any);
    
    const { sendMessageToCoach } = await import('@/lib/api');
    vi.mocked(sendMessageToCoach).mockResolvedValue({ response: 'Hello John!' } as any);

    render(<CoachPage />);
    
    expect(screen.getByText(/Hola, soy Anna/)).toBeInTheDocument();

    await waitFor(() => {
    });
  });
});
