import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test-utils';
import { MonthlyReportModal } from './MonthlyReportModal';

describe('MonthlyReportModal', () => {
  const mockReport = {
    id: 'test-id',
    month: '2023-10',
    summary: 'Great month of training!',
    totalEntries: 15,
    maxStreak: 5,
    topActivity: 'Running',
    createdAt: Date.now(),
  };

  it('does not render when report is null', () => {
    const { container } = render(<MonthlyReportModal report={null} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders report details correctly', () => {
    render(<MonthlyReportModal report={mockReport} onClose={() => {}} />);
    
    expect(screen.getByText('Resumen Mensual')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText(/"Great month of training!"/)).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<MonthlyReportModal report={mockReport} onClose={handleClose} />);

    const closeButtons = screen.getAllByRole('button');
    fireEvent.click(closeButtons[0]!);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
