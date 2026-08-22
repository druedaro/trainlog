import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { InstallPWA } from './InstallPWA';

describe('InstallPWA', () => {
  let originalAddEventListener: typeof window.addEventListener;

  beforeEach(() => {
    originalAddEventListener = window.addEventListener;
  });

  afterEach(() => {
    window.addEventListener = originalAddEventListener;
  });

  it('does not render initially', () => {
    const { container } = render(<InstallPWA />);
    expect(container.firstChild).toBeNull();
  });

  it('renders when beforeinstallprompt event is fired', () => {
    render(<InstallPWA />);
    
    const event = new Event('beforeinstallprompt');
    Object.assign(event, { prompt: vi.fn(), userChoice: Promise.resolve({ outcome: 'accepted' }) });
    
    act(() => {
      window.dispatchEvent(event);
    });
    
    expect(screen.getByText('Instalar Trainlog')).toBeInTheDocument();
  });

  it('hides when closed', () => {
    render(<InstallPWA />);
    
    const event = new Event('beforeinstallprompt');
    Object.assign(event, { prompt: vi.fn(), userChoice: Promise.resolve({ outcome: 'accepted' }) });
    
    act(() => {
      window.dispatchEvent(event);
    });
    
    const closeButton = screen.getAllByRole('button')[1]; // the X button
    act(() => {
      fireEvent.click(closeButton!);
    });
    
    expect(screen.queryByText('Instalar Trainlog')).not.toBeInTheDocument();
  });
});
