export function calculateStreak(entryDates: number[], trainingDays?: number[]): number {
  if (!entryDates || entryDates.length === 0) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dates = entryDates.map(date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });
  
  const uniqueDates = [...new Set(dates)].sort((a, b) => b - a);
  let currentDate = today;
  let streak = 0;
  
  // Default to all 7 days if undefined to not break existing user streaks
  const expectedDays = trainingDays && trainingDays.length > 0 ? trainingDays : [0, 1, 2, 3, 4, 5, 6];

  let i = 0;
  let isFirstDayChecked = false;

  while (i < uniqueDates.length) {
    const currentDayOfWeek = currentDate.getDay();
    const currentTimestamp = currentDate.getTime();
    const entryTimestamp = uniqueDates[i];
    
    if (entryTimestamp === currentTimestamp) {
      streak++;
      i++;
      isFirstDayChecked = true;
    } else if (entryTimestamp > currentTimestamp) {
      i++;
      continue;
    } else {
      if (!isFirstDayChecked && currentTimestamp === today.getTime()) {
        isFirstDayChecked = true;
      } else {
        if (expectedDays.includes(currentDayOfWeek)) {
          break;
        }
      }
    }
    
    currentDate = new Date(currentDate.getTime() - 86400000);
  }
  
  return streak;
}

export type AchievementCategory = 'consistency' | 'learning' | 'insight' | 'social';
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: string;
}

export const ACHIEVEMENTS: Record<string, Achievement> = {
  first_entry: {
    id: 'first_entry',
    title: 'Rompiendo el hielo',
    description: 'Has registrado tu primer entrenamiento.',
    category: 'consistency',
    tier: 'bronze',
    icon: '🧊'
  },
  streak_3: {
    id: 'streak_3',
    title: 'Constancia',
    description: 'Has registrado entrenamientos 3 días seguidos.',
    category: 'consistency',
    tier: 'silver',
    icon: '🔥'
  },
  streak_7: {
    id: 'streak_7',
    title: 'Imparable',
    description: 'Has registrado entrenamientos 7 días seguidos.',
    category: 'consistency',
    tier: 'gold',
    icon: '⚡'
  },
  first_article: {
    id: 'first_article',
    title: 'Estudiante',
    description: 'Has guardado tu primer artículo de Discover.',
    category: 'learning',
    tier: 'bronze',
    icon: '📚'
  },
  articles_10: {
    id: 'articles_10',
    title: 'Lector Ávido',
    description: 'Has guardado 10 artículos en tu colección.',
    category: 'learning',
    tier: 'silver',
    icon: '📖'
  },
  articles_50: {
    id: 'articles_50',
    title: 'Erudito',
    description: 'Has guardado 50 artículos en tu colección.',
    category: 'learning',
    tier: 'gold',
    icon: '🧠'
  },
  coach_chat: {
    id: 'coach_chat',
    title: 'Buscando consejo',
    description: 'Has hablado por primera vez con Anna.',
    category: 'learning',
    tier: 'bronze',
    icon: '🤖'
  },
  social_training: {
    id: 'social_training',
    title: 'Mejor en compañía',
    description: 'Has entrenado con alguien más.',
    category: 'social',
    tier: 'silver',
    icon: '🤝'
  },
  emotional_strength: {
    id: 'emotional_strength',
    title: 'El paso más difícil',
    description: 'Has registrado un entrenamiento a pesar de sentirte mal.',
    category: 'insight',
    tier: 'gold',
    icon: '🛡️'
  },
  mental_clarity: {
    id: 'mental_clarity',
    title: 'Mente en blanco',
    description: 'El entrenamiento te ha servido de terapia o para desconectar.',
    category: 'insight',
    tier: 'silver',
    icon: '🧘'
  }
};

export function checkAchievements(
  currentAchievements: string[],
  context: {
    entryCount?: number;
    streak?: number;
    savedArticlesCount?: number;
    hasChatted?: boolean;
    transcript?: string;
    perceivedMood?: string | null;
  }
): string[] {
  const newUnlocks: string[] = [];
  const alreadyUnlocked = new Set(currentAchievements || []);

  const unlock = (id: string) => {
    if (!alreadyUnlocked.has(id)) {
      newUnlocks.push(id);
      alreadyUnlocked.add(id);
    }
  };

  if (context.entryCount && context.entryCount >= 1) unlock('first_entry');
  if (context.streak && context.streak >= 3) unlock('streak_3');
  if (context.streak && context.streak >= 7) unlock('streak_7');
  if (context.savedArticlesCount && context.savedArticlesCount >= 1) unlock('first_article');
  if (context.savedArticlesCount && context.savedArticlesCount >= 10) unlock('articles_10');
  if (context.savedArticlesCount && context.savedArticlesCount >= 50) unlock('articles_50');
  if (context.hasChatted) unlock('coach_chat');


  if (context.transcript) {
    const transcriptLower = context.transcript.toLowerCase();
    const socialKeywords = ['con ', 'junto a ', 'acompañado'];
    if (socialKeywords.some(kw => transcriptLower.includes(kw))) {
      unlock('social_training');
    }


    const mentalKeywords = ['desconectar', 'despejar', 'terapia', 'escapar', 'olvidar'];
    if (mentalKeywords.some(kw => transcriptLower.includes(kw))) {
      unlock('mental_clarity');
    }
  }


  if (context.perceivedMood && (context.perceivedMood === 'very_negative' || context.perceivedMood === 'negative')) {
    unlock('emotional_strength');
  }

  return newUnlocks;
}
