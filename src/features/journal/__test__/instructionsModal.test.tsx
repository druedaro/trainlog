import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JournalInstructionsModal } from '@/features/journal/JournalInstructionsModal';

describe('Feature: Journal Instructions Modal', () => {
  it('Given the modal is not open, When rendered, Then it should return null', () => {
    const { container } = render(<JournalInstructionsModal isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('Given the modal is open, When rendered, Then it displays the tips and can be closed', () => {
    const onClose = vi.fn();
    render(<JournalInstructionsModal isOpen={true} onClose={onClose} />);
    
    expect(screen.getByText('Tips para tu Diario')).toBeInTheDocument();
    
    const closeButton = screen.getByText('¡Entendido!');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalledOnce();
  });
});
