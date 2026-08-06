import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalysisView } from '@/features/journal/AnalysisView';

describe('Feature: Journal Analysis View', () => {
  it('Given an analysis, When rendered, Then it displays the summary and themes', () => {
    const analysis = {
      summary: 'Good run today.',
      themes: ['running', 'endurance'],
      perceivedEnergy: 'high' as const,
      perceivedMood: 'positive' as const,
      activities: ['running'],
      reflectionPrompt: null,
    };

    render(<AnalysisView analysis={analysis as any} onConfirm={vi.fn()} onRetry={vi.fn()} />);

    expect(screen.getByText('Análisis de tu reflexión')).toBeInTheDocument();
    expect(screen.getByText('Good run today.')).toBeInTheDocument();
    expect(screen.getAllByText('running')[0]).toBeInTheDocument();
    expect(screen.getByText('endurance')).toBeInTheDocument();
  });

  it('Given an analysis with a reflection prompt, When rendered, Then it displays the prompt', () => {
    const analysis = {
      summary: 'Tough session.',
      themes: [],
      perceivedEnergy: 'low' as const,
      perceivedMood: 'negative' as const,
      activities: [],
      reflectionPrompt: 'Why did you feel so tired?',
    };

    render(<AnalysisView analysis={analysis as any} onConfirm={vi.fn()} onRetry={vi.fn()} />);
    expect(screen.getByText('Why did you feel so tired?')).toBeInTheDocument();
  });
});
