import { z } from 'zod';


export const entryAnalysisSchema = z.object({
  summary: z
    .string()
    .min(1, 'Summary must not be empty.')
    .describe('A concise summary of the training reflection.'),
  themes: z
    .array(z.string())
    .min(1, 'At least one theme is required.')
    .describe('Key themes identified in the reflection.'),
  perceivedEnergy: z
    .enum(['very_low', 'low', 'moderate', 'high', 'very_high'])
    .nullable()
    .describe('Perceived energy level, or null if not mentioned.'),
  perceivedMood: z
    .enum(['very_negative', 'negative', 'neutral', 'positive', 'very_positive'])
    .nullable()
    .describe('Perceived mood, or null if not mentioned.'),
  activities: z
    .array(z.string())
    .describe('Activities mentioned in the reflection.'),
  reflectionPrompt: z
    .string()
    .nullable()
    .describe(
      'A helpful reflection question for the user, or null when none adds value.',
    ),
});

export type EntryAnalysis = z.infer<typeof entryAnalysisSchema>;

export interface JournalEntry {
  id: string;
  userId: string;
  transcript: string;
  analysis: EntryAnalysis;
  contextualResponse?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
