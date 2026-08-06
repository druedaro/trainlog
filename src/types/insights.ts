export interface WeeklySynthesis {
  summary: string;
  highlights: string[];
}

export interface InsightsDocument {
  synthesis: WeeklySynthesis | null;
  updatedAt: number; 
}
