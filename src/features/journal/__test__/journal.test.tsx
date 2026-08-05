import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecordButton } from '@/features/journal/RecordButton';
import { TranscriptEditor } from '@/features/journal/TranscriptEditor';
import { entryAnalysisSchema } from '@/types/entry';

describe('Feature: Journal and Analysis Validation', () => {
  describe('Scenario: Validating AI analysis response', () => {
    const validAnalysis = {
      summary: 'Good running session with moderate energy.',
      themes: ['endurance', 'enjoyment'],
      perceivedEnergy: 'moderate' as const,
      perceivedMood: 'positive' as const,
      activities: ['running'],
      reflectionPrompt: null,
    };

    it('Given a valid AI response, When validating schema, Then it should succeed', () => {
      const result = entryAnalysisSchema.safeParse(validAnalysis);
      expect(result.success).toBe(true);
    });

    it('Given an incomplete AI response, When validating schema, Then it should fail', () => {
      const result = entryAnalysisSchema.safeParse({ ...validAnalysis, summary: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('Scenario: Recording an entry', () => {
    it('Given the user is idle, When they view the record button, Then it prompts them to start', () => {
      render(<RecordButton isRecording={false} durationMs={0} onStart={vi.fn()} onStop={vi.fn()} />);
      expect(screen.getByText('Toca para grabar')).toBeInTheDocument();
    });

    it('Given the user is recording, When they tap stop, Then the recording finishes', () => {
      const onStop = vi.fn();
      render(<RecordButton isRecording={true} durationMs={5000} onStart={vi.fn()} onStop={onStop} />);
      
      fireEvent.click(screen.getByLabelText('Stop recording'));
      expect(onStop).toHaveBeenCalledOnce();
    });
  });

  describe('Scenario: Editing a transcript', () => {
    it('Given a generated transcript, When the user edits it, Then the changes are saved', async () => {
      const onConfirm = vi.fn();
      render(<TranscriptEditor transcript="I ran 5km" onConfirm={onConfirm} onDiscard={vi.fn()} />);
      
      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'I ran 10km' } });
      fireEvent.click(screen.getByText(/Confirmar y analizar/));
      
      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledWith('I ran 10km');
      });
    });
  });
});
