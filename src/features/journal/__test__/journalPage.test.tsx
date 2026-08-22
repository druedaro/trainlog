import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test-utils';
import { BrowserRouter } from 'react-router';
import { JournalPage } from '@/features/journal/JournalPage';
import { useAuth } from '@/features/auth/useAuth';
import { useVoiceRecorder } from '@/features/journal/useVoiceRecorder';

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/features/journal/useVoiceRecorder', () => ({
  useVoiceRecorder: vi.fn(),
}));

vi.mock('@/features/journal/CalendarView', () => ({
  CalendarView: () => <div data-testid="calendar-view">Calendar</div>,
}));

describe('Feature: Journal Page', () => {
  it('Given the user is authenticated and idle, When rendering, Then it shows the record button and calendar', () => {
    vi.mocked(useAuth).mockReturnValue({ user: { uid: '123' } } as any);
    vi.mocked(useVoiceRecorder).mockReturnValue({
      status: 'idle',
      durationMs: 0,
      audioBlob: null,
      startRecording: vi.fn(),
      stopRecording: vi.fn(),
      resetRecording: vi.fn(),
    } as any);

    render(
      <BrowserRouter>
        <JournalPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Tips para grabar')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-view')).toBeInTheDocument();
  });
});
