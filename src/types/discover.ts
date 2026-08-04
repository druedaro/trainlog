// --- Discover types ---

export type DiscoverCategory = 'recovery' | 'training' | 'mindset';

export interface DiscoverArticle {
  id: string;
  title: string;
  emoji: string;
  category: DiscoverCategory;
  content: string;  // Markdown (may include ExerciseDB GIFs)
  reason: string;   // e.g. "Based on your recent fatigue reports"
}

export interface DiscoverDocument {
  articles: DiscoverArticle[];
  updatedAt: number; // Unix timestamp (ms)
}
