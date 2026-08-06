import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/components/theme/ThemeProvider';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

describe('Feature: Theme System', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('Given no initial theme, When rendering ThemeProvider, Then it defaults to system preference', () => {
    // Mock system preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false, // system is light
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    render(
      <ThemeProvider defaultTheme="system">
        <ThemeToggle />
      </ThemeProvider>
    );

    // Light theme should not have 'dark' class on HTML
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('Given dark theme is set, When clicking toggle, Then it changes to light', () => {
    render(
      <ThemeProvider defaultTheme="dark">
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(document.documentElement.classList.contains('dark')).toBe(true);

    const toggleBtn = screen.getByLabelText(/Toggle theme/i);
    fireEvent.click(toggleBtn);

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
