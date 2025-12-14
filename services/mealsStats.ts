import { getMealsByDateRange, getAllMealDates } from './mealsDb';

export interface TodaySummary {
  totalCalories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  caloriesTarget: number;
  progress: number; // 0–1
}

export async function getTodaySummary(today: Date, calorieTarget: number): Promise<TodaySummary> {
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);

  const meals = await getMealsByDateRange(startOfDay.toISOString(), endOfDay.toISOString());

  const summary = meals.reduce((acc, meal) => {
    return {
      totalCalories: acc.totalCalories + (meal.caloriesEstimate || 0),
      protein: acc.protein + (meal.proteinGrams || 0),
      carbs: acc.carbs + (meal.carbsGrams || 0),
      fats: acc.fats + (meal.fatGrams || 0),
      fiber: acc.fiber + (meal.fiberGrams || 0),
    };
  }, {
    totalCalories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    fiber: 0,
  });

  return {
    ...summary,
    caloriesTarget: calorieTarget,
    progress: calorieTarget > 0 ? Math.min(summary.totalCalories / calorieTarget, 1) : 0,
  };
}

export async function getStreak(): Promise<number> {
  const dates = await getAllMealDates();
  
  if (dates.length === 0) return 0;

  // Normalize dates to YYYY-MM-DD to avoid time issues
  const uniqueDays = new Set<string>();
  dates.forEach(d => {
    const day = new Date(d).toISOString().split('T')[0];
    uniqueDays.add(day);
  });

  let streak = 0;
  const today = new Date();

  // If today has a meal, start counting from today.
  // If today has NO meal, check yesterday. If yesterday has meal, start counting from yesterday.
  // If neither, streak is 0.
  
  let currentCheck = new Date(today);
  let currentStr = currentCheck.toISOString().split('T')[0];

  if (!uniqueDays.has(currentStr)) {
     // Check yesterday
     currentCheck.setDate(currentCheck.getDate() - 1);
     currentStr = currentCheck.toISOString().split('T')[0];
     if (!uniqueDays.has(currentStr)) {
       return 0;
     }
  }

  // Now currentStr is a day that has a meal (either today or yesterday)
  // Walk backwards
  while (true) {
    if (uniqueDays.has(currentStr)) {
      streak++;
      // go to previous day
      currentCheck.setDate(currentCheck.getDate() - 1);
      currentStr = currentCheck.toISOString().split('T')[0];
    } else {
      break;
    }
  }

  return streak;
}
