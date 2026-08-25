
export type DiscoverCategory = 'recovery' | 'training' | 'mindset' | 'nutrition' | 'general';

export interface DiscoverArticle {
  id: string;
  title: string;
  emoji: string;
  category: DiscoverCategory;
  content: string;  
  reason: string;   
  imageUrl?: string;
  isRead?: boolean;
  savedAt?: number;
}

export interface DiscoverDocument {
  articles: DiscoverArticle[];
  updatedAt: number; 
}
