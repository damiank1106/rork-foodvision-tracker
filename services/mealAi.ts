import { getStoredDeepSeekKey } from '@/hooks/useSettings';
import { SavedMeal } from '@/services/mealsDb';

export async function askMealAI(meal: SavedMeal, userQuestion: string): Promise<string> {
  const apiKey = await getStoredDeepSeekKey();
  if (!apiKey) {
    throw new Error('DeepSeek API key not found. Please add it in Settings.');
  }

  const dateLabel = new Date(meal.dateTime || meal.createdAt).toLocaleString();
  const good = meal.goodPoints.join(', ') || 'N/A';
  const bad = meal.badPoints.join(', ') || 'N/A';

  const mealContext = `Meal name: ${meal.name || meal.dishName}
Source: ${meal.source}
Date & time: ${dateLabel}
Notes: ${meal.notes || 'None'}
Nutrition summary: ${meal.nutritionSummary || 'Not provided'}
Calories: ${meal.caloriesEstimate || 0} kcal
Protein: ${meal.proteinGrams || 0} g | Carbs: ${meal.carbsGrams || 0} g | Fat: ${meal.fatGrams || 0} g | Fiber: ${meal.fiberGrams || 0} g
Good points: ${good}
Concerns: ${bad}`;

  const messages = [
    {
      role: 'system',
      content: `You are a concise and friendly nutrition assistant. Only answer about the specific meal provided.
Provide actionable, encouraging tips that stay within the meal context. Keep replies under 120 words.`
    },
    {
      role: 'user',
      content: `${mealContext}\n\nUser question: ${userQuestion}`
    }
  ];

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('DeepSeek API Error (Meal AI):', response.status, errorText);
    throw new Error('AI request failed');
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "I couldn't generate a response.";
}
