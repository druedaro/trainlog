import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { BottomNav } from '@/components/BottomNav';

describe('Feature: Bottom Navigation', () => {
  it('Given the app is running, When BottomNav is rendered, Then it displays all main links', () => {
    render(
      <BrowserRouter>
        <BottomNav />
      </BrowserRouter>
    );

    // The nav uses buttons for routing
    expect(screen.getByText('Journal')).toBeInTheDocument();
    expect(screen.getByText('Insights')).toBeInTheDocument();
    expect(screen.getByText('Coach')).toBeInTheDocument();
    expect(screen.getByText('Discover')).toBeInTheDocument();
    expect(screen.getByText('Perfil')).toBeInTheDocument();
  });
});
