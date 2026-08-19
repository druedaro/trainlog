export function calculateStreak(entryDates: number[]): number {
  if (!entryDates || entryDates.length === 0) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dates = entryDates.map(date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  });
  
  const uniqueDates = [...new Set(dates)].sort((a, b) => b - a);
  let currentDate = today.getTime();
  let streak = 0;

  if (uniqueDates[0] === currentDate) {
    streak = 1;
    currentDate -= 86400000;
    for (let i = 1; i < uniqueDates.length; i++) {
      if (uniqueDates[i] === currentDate) {
        streak++;
        currentDate -= 86400000;
      } else {
        break;
      }
    }
  } else if (uniqueDates[0] === currentDate - 86400000) {
    streak = 1;
    currentDate -= 172800000;
    for (let i = 1; i < uniqueDates.length; i++) {
      if (uniqueDates[i] === currentDate) {
        streak++;
        currentDate -= 86400000;
      } else {
        break;
      }
    }
  }

  return streak;
}
