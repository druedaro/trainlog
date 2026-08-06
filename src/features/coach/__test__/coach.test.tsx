import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
  fetchEntriesByDays: vi.fn(),
}));

describe('Feature: Coach Chat', () => {
  it('Given an authenticated user, When sending a message, Then it adds it to the chat', async () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: '123' }, profile: { displayName: 'John' } } as any);
    
    // Mock entries so the input is enabled
    vi.mocked(firestore.fetchEntriesByDays).mockResolvedValue([{ id: '1', transcript: 'test' }] as any);
    
    const { sendMessageToCoach } = await import('@/lib/api');
    vi.mocked(sendMessageToCoach).mockResolvedValue({ response: 'Hello John!' } as any);

    render(<CoachPage />);
    
    expect(screen.getByText(/Hola, soy Anna/)).toBeInTheDocument();

    await waitFor(() => {
      const input = screen.getByPlaceholderText(/Pregunta a tu coach/i);
      expect(input).not.toBeDisabled();
    });

    const input = screen.getByPlaceholderText(/Pregunta a tu coach/i);
    fireEvent.change(input, { target: { value: 'How is my form?' } });
    
    // Using closest button with Send icon or adding role
    const sendButton = input.nextElementSibling as HTMLButtonElement;
    fireEvent.click(sendButton);

    expect(screen.getByText('How is my form?')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Hello John!')).toBeInTheDocument();
    });
  });
});
