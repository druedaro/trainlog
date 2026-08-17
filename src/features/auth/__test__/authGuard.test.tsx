import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { AuthGuard } from '@/features/auth/AuthGuard';
import { useAuth } from '@/features/auth/useAuth';

vi.mock('@/features/auth/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('Feature: Auth Guard', () => {
  it('Given user is authenticated, When accessing a protected route, Then it renders children', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { uid: '123' },
      profile: { onboardingCompleted: true },
      isLoading: false,
    } as any);

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<AuthGuard />}>
            <Route path="/protected" element={<div data-testid="protected-content">Secret</div>} />
          </Route>
          <Route path="/onboarding" element={<div data-testid="onboarding-page">Onboarding</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  it('Given user is unauthenticated, When accessing a protected route, Then it redirects to login', () => {
    vi.mocked(useAuth).mockReturnValue({ user: null, profile: null, isLoading: false } as any);

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route element={<AuthGuard />}>
            <Route path="/protected" element={<div data-testid="protected-content">Secret</div>} />
          </Route>
          <Route path="/login" element={<div data-testid="login-page">Login</div>} />
          <Route path="/onboarding" element={<div data-testid="onboarding-page">Onboarding</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
  });
});
