import { getMealsByDateRange } from '@/services/mealsDb';
import { getStoredOpenAiKey } from '@/hooks/useSettings';

export interface WeeklyReport {
  startDate: string;          // ISO
  endDate: string;            // ISO
  totalCalories: number;
  averageCaloriesPerDay: number;
  totalMeals: number;
  averageProteinPerDay: number;
  averageCarbsPerDay: number;
  averageFatsPerDay: number;
  daySummaries: {
    date: string;             // YYYY-MM-DD
    totalCalories: number;
    mealsCount: number;
    protein: number;
    carbs: number;
    fats: number;
  }[];
}

export async function getWeeklyReport(today: Date = new Date()): Promise<WeeklyReport> {
  // Use "Last 7 Days" logic (including today)
  const endDate = new Date(today);
  endDate.setHours(23, 59, 59, 999);
  
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 6); // Go back 6 days to get 7 days total
  startDate.setHours(0, 0, 0, 0);

  const meals = await getMealsByDateRange(startDate.toISOString(), endDate.toISOString());

  // Initialize daily buckets
  const daySummaries: WeeklyReport['daySummaries'] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    daySummaries.push({
      date: dateStr,
      totalCalories: 0,
      mealsCount: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
    });
  }

  // Aggregate meals
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFats = 0;

  meals.forEach(meal => {
    const mealDate = meal.createdAt.split('T')[0];
    const dayStat = daySummaries.find(d => d.date === mealDate);
    if (dayStat) {
      dayStat.totalCalories += meal.caloriesEstimate;
      dayStat.mealsCount += 1;
      dayStat.protein += meal.proteinGrams;
      dayStat.carbs += meal.carbsGrams;
      dayStat.fats += meal.fatGrams;

      totalCalories += meal.caloriesEstimate;
      totalProtein += meal.proteinGrams;
      totalCarbs += meal.carbsGrams;
      totalFats += meal.fatGrams;
    }
  });

  const totalMeals = meals.length;
  // Averages per day (over 7 days)
  const averageCaloriesPerDay = Math.round(totalCalories / 7);
  const averageProteinPerDay = Math.round(totalProtein / 7);
  const averageCarbsPerDay = Math.round(totalCarbs / 7);
  const averageFatsPerDay = Math.round(totalFats / 7);

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    totalCalories,
    averageCaloriesPerDay,
    totalMeals,
    averageProteinPerDay,
    averageCarbsPerDay,
    averageFatsPerDay,
    daySummaries,
  };
}

export async function getWeeklyAiSummary(report: WeeklyReport): Promise<string> {
  const apiKey = await getStoredOpenAiKey();
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please add it in Settings.');
  }

  try {
    const reportSummary = `
      Period: ${new Date(report.startDate).toDateString()} to ${new Date(report.endDate).toDateString()}
      Total Calories: ${report.totalCalories}
      Avg Calories/Day: ${report.averageCaloriesPerDay}
      Total Meals: ${report.totalMeals}
      Avg Macros/Day: Protein ${report.averageProteinPerDay}g, Carbs ${report.averageCarbsPerDay}g, Fat ${report.averageFatsPerDay}g
      Daily Breakdown (Cals): ${report.daySummaries.map(d => `${d.date}: ${d.totalCalories}`).join(', ')}
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a nutrition coach. Based on this weekly data, give me a short, friendly summary and 2–4 suggestions on how to improve next week. Avoid medical claims.
            
            Weekly Data:
            ${reportSummary}`
          }
        ],
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content || "Could not generate summary.";
  } catch (error) {
    console.error('Error getting weekly AI summary:', error);
    throw error;
  }
}
