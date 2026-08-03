import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AnalysisView } from '@/features/journal/AnalysisView';
import { TranscriptEditor } from '@/features/journal/TranscriptEditor';
import { RecordButton } from '@/features/journal/RecordButton';
import { entryAnalysisSchema } from '@/types/entry';
import type { EntryAnalysis } from '@/types/entry';

// --- Zod validation tests ---

describe('entryAnalysisSchema', () => {
  const validAnalysis = {
    summary: 'Good running session with moderate energy.',
    themes: ['endurance', 'enjoyment'],
    perceivedEnergy: 'moderate' as const,
    perceivedMood: 'positive' as const,
    activities: ['running'],
    reflectionPrompt: null,
  };

  it('validates a correct analysis response', () => {
    const result = entryAnalysisSchema.safeParse(validAnalysis);
    expect(result.success).toBe(true);
  });

  it('rejects an empty summary', () => {
    const result = entryAnalysisSchema.safeParse({
      ...validAnalysis,
      summary: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty themes array', () => {
    const result = entryAnalysisSchema.safeParse({
      ...validAnalysis,
      themes: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid energy values', () => {
    const result = entryAnalysisSchema.safeParse({
      ...validAnalysis,
      perceivedEnergy: 'super_high',
    });
    expect(result.success).toBe(false);
  });

  it('accepts null energy and mood', () => {
    const result = entryAnalysisSchema.safeParse({
      ...validAnalysis,
      perceivedEnergy: null,
      perceivedMood: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const result = entryAnalysisSchema.safeParse({
      summary: 'Test',
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-object input', () => {
    const result = entryAnalysisSchema.safeParse('just a string');
    expect(result.success).toBe(false);
  });

  it('rejects null input', () => {
    const result = entryAnalysisSchema.safeParse(null);
    expect(result.success).toBe(false);
  });
});

// --- RecordButton tests ---

describe('RecordButton', () => {
  it('renders start recording state', () => {
    render(
      <RecordButton
        isRecording={false}
        durationMs={0}
        onStart={vi.fn()}
        onStop={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Start recording')).toBeInTheDocument();
    expect(screen.getByText('Tap to start recording')).toBeInTheDocument();
  });

  it('renders recording state with duration', () => {
    render(
      <RecordButton
        isRecording={true}
        durationMs={65000}
        onStart={vi.fn()}
        onStop={vi.fn()}
      />,
    );

    expect(screen.getByLabelText('Stop recording')).toBeInTheDocument();
    expect(screen.getByText('1:05')).toBeInTheDocument();
  });

  it('calls onStart when tapped in idle state', () => {
    const onStart = vi.fn();

    render(
      <RecordButton
        isRecording={false}
        durationMs={0}
        onStart={onStart}
        onStop={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText('Start recording'));
    expect(onStart).toHaveBeenCalledOnce();
  });

  it('calls onStop when tapped in recording state', () => {
    const onStop = vi.fn();

    render(
      <RecordButton
        isRecording={true}
        durationMs={5000}
        onStart={vi.fn()}
        onStop={onStop}
      />,
    );

    fireEvent.click(screen.getByLabelText('Stop recording'));
    expect(onStop).toHaveBeenCalledOnce();
  });
});

// --- TranscriptEditor tests ---

describe('TranscriptEditor', () => {
  it('renders with the provided transcript', () => {
    render(
      <TranscriptEditor
        transcript="Great session today"
        onConfirm={vi.fn()}
        onDiscard={vi.fn()}
      />,
    );

    const textarea = screen.getByPlaceholderText(
      'Your transcript will appear here...',
    );
    expect(textarea).toHaveValue('Great session today');
  });

  it('calls onConfirm with the transcript text', async () => {
    const onConfirm = vi.fn();

    render(
      <TranscriptEditor
        transcript="Great session today"
        onConfirm={onConfirm}
        onDiscard={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('Confirm & Analyze'));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith('Great session today');
    });
  });

  it('calls onDiscard when discard is clicked', () => {
    const onDiscard = vi.fn();

    render(
      <TranscriptEditor
        transcript="Some text"
        onConfirm={vi.fn()}
        onDiscard={onDiscard}
      />,
    );

    fireEvent.click(screen.getByText('Discard'));
    expect(onDiscard).toHaveBeenCalledOnce();
  });
});

// --- AnalysisView tests ---

describe('AnalysisView', () => {
  const mockAnalysis: EntryAnalysis = {
    summary: 'A solid training session with good energy levels.',
    themes: ['motivation', 'endurance'],
    perceivedEnergy: 'high',
    perceivedMood: 'positive',
    activities: ['running', 'stretching'],
    reflectionPrompt: 'What made this session feel different from last week?',
  };

  it('displays the analysis summary', () => {
    render(
      <AnalysisView
        analysis={mockAnalysis}
        onConfirm={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(
      screen.getByText('A solid training session with good energy levels.'),
    ).toBeInTheDocument();
  });

  it('displays themes as tags', () => {
    render(
      <AnalysisView
        analysis={mockAnalysis}
        onConfirm={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText('motivation')).toBeInTheDocument();
    expect(screen.getByText('endurance')).toBeInTheDocument();
  });

  it('displays energy and mood labels', () => {
    render(
      <AnalysisView
        analysis={mockAnalysis}
        onConfirm={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByText(/High/)).toBeInTheDocument();
    expect(screen.getByText(/Positive/)).toBeInTheDocument();
  });

  it('displays the reflection prompt', () => {
    render(
      <AnalysisView
        analysis={mockAnalysis}
        onConfirm={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        'What made this session feel different from last week?',
      ),
    ).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();

    render(
      <AnalysisView
        analysis={mockAnalysis}
        onConfirm={onConfirm}
        onRetry={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText('Confirm & Save'));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('hides energy when not provided', () => {
    render(
      <AnalysisView
        analysis={{ ...mockAnalysis, perceivedEnergy: null }}
        onConfirm={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.queryByText('Energy')).not.toBeInTheDocument();
  });

  it('hides reflection prompt when null', () => {
    render(
      <AnalysisView
        analysis={{ ...mockAnalysis, reflectionPrompt: null }}
        onConfirm={vi.fn()}
        onRetry={vi.fn()}
      />,
    );

    expect(
      screen.queryByText('Something to reflect on'),
    ).not.toBeInTheDocument();
  });
});
