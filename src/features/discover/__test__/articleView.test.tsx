import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ArticleView } from '@/features/discover/ArticleView';

describe('Feature: Article View', () => {
  it('Given an article, When rendering ArticleView, Then it displays the content', async () => {
    const mockArticle = {
      id: 'article1',
      title: 'How to rest properly',
      type: 'tip' as const,
      category: 'recovery',
      tags: ['recovery'],
      content: '# Rest is important\n\nMake sure you sleep 8 hours.',
      readTimeMinutes: 2,
    };

    render(
      <ArticleView article={mockArticle} onBack={vi.fn()} />
    );

    // Testing markdown rendering
    await waitFor(() => {
      expect(screen.getByText('How to rest properly')).toBeInTheDocument();
      expect(screen.getByText('Rest is important')).toBeInTheDocument();
      expect(screen.getByText('Make sure you sleep 8 hours.')).toBeInTheDocument();
    });
  });
});
