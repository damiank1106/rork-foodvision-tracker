import { getStoredOpenAiKey } from '@/hooks/useSettings';
import * as FileSystem from 'expo-file-system/legacy';

export interface MealAnalysisResult {
  dishName: string;
  ingredientsDescription: string;
  nutritionSummary: string;
  caloriesEstimate: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  goodPoints: string[];
  badPoints: string[];
}

export async function analyzeMealWithOpenAi(imageUri: string, contextText?: string): Promise<MealAnalysisResult> {
  const apiKey = await getStoredOpenAiKey();
  if (!apiKey) {
    throw new Error('OpenAI API key not found. Please add it in Settings first.');
  }

  try {
    const base64Image = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    const userContent: any[] = [
      {
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${base64Image}`,
        },
      },
    ];

    if (contextText) {
      userContent.push({
        type: 'text',
        text: `Additional context from user: ${contextText}`,
      });
    }

    const systemPrompt = `You are a nutrition assistant. I will give you a food photo${contextText ? ' and additional context about the meal' : ''}.
1. Guess the name of the dish.
2. Describe the likely ingredients in one short paragraph.
3. Estimate total calories and grams of protein, carbs, fat and fiber. Use reasonable ranges.
4. List 2–5 'good points' (health benefits).
5. List 2–5 'bad points' or concerns (e.g. high sodium, high sugar, high saturated fat).
${contextText ? 'Take the user-provided context into account for better accuracy.' : ''}
Please respond in JSON with this exact shape:
{
  "dishName": string,
  "ingredientsDescription": string,
  "nutritionSummary": string,
  "caloriesEstimate": number,
  "proteinGrams": number,
  "carbsGrams": number,
  "fatGrams": number,
  "fiberGrams": number,
  "goodPoints": string[],
  "badPoints": string[]
}`;

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
            content: systemPrompt
          },
          {
            role: 'user',
            content: userContent,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API Error:', response.status, errorText);
      throw new Error(`OpenAI API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    try {
      const result = JSON.parse(content);
      return {
        dishName: result.dishName || 'Unknown Dish',
        ingredientsDescription: result.ingredientsDescription || 'No ingredients described.',
        nutritionSummary: result.nutritionSummary || 'No nutrition summary available.',
        caloriesEstimate: typeof result.caloriesEstimate === 'number' ? result.caloriesEstimate : 0,
        proteinGrams: typeof result.proteinGrams === 'number' ? result.proteinGrams : 0,
        carbsGrams: typeof result.carbsGrams === 'number' ? result.carbsGrams : 0,
        fatGrams: typeof result.fatGrams === 'number' ? result.fatGrams : 0,
        fiberGrams: typeof result.fiberGrams === 'number' ? result.fiberGrams : 0,
        goodPoints: Array.isArray(result.goodPoints) ? result.goodPoints : [],
        badPoints: Array.isArray(result.badPoints) ? result.badPoints : [],
      };
    } catch {
      console.error('Failed to parse OpenAI response as JSON:', content);
      throw new Error('Failed to parse analysis results.');
    }

  } catch (error) {
    console.error('Error analyzing meal:', error);
    throw error;
  }
}
