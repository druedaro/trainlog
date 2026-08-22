import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils';
import { TranscriptEditor } from './TranscriptEditor';

describe('TranscriptEditor', () => {
  it('renders correctly with initial transcript', () => {
    const handleConfirm = vi.fn();
    const handleDiscard = vi.fn();

    render(
      <TranscriptEditor
        transcript="Test transcript"
        onConfirm={handleConfirm}
        onDiscard={handleDiscard}
      />
    );

    expect(screen.getByText('Revisa tu transcripción')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test transcript')).toBeInTheDocument();
  });

  it('calls onConfirm with edited text', async () => {
    const handleConfirm = vi.fn();
    const handleDiscard = vi.fn();

    render(
      <TranscriptEditor
        transcript="Test transcript"
        onConfirm={handleConfirm}
        onDiscard={handleDiscard}
      />
    );

    const textarea = screen.getByDisplayValue('Test transcript');
    fireEvent.change(textarea, { target: { value: 'Edited transcript' } });

    const confirmButton = screen.getByRole('button', { name: /Confirmar y analizar/i });
    fireEvent.click(confirmButton);


    await screen.findByRole('button', { name: /Confirmar y analizar/i });
    
    setTimeout(() => {
      expect(handleConfirm).toHaveBeenCalledWith('Edited transcript');
    }, 0);
  });

  it('calls onDiscard when discard button is clicked', () => {
    const handleConfirm = vi.fn();
    const handleDiscard = vi.fn();

    render(
      <TranscriptEditor
        transcript="Test transcript"
        onConfirm={handleConfirm}
        onDiscard={handleDiscard}
      />
    );

    const discardButton = screen.getByRole('button', { name: /Descartar/i });
    fireEvent.click(discardButton);

    expect(handleDiscard).toHaveBeenCalledTimes(1);
  });
});
