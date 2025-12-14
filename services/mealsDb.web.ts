import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SavedMeal {
  id: string;
  imageUri: string;
  createdAt: string; // ISO date
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

export interface MealStats {
  totalMeals: number;
  totalCalories: number;
  averageCalories: number;
  last7DaysCalories: number;
}

const STORAGE_KEY = 'foodvision_meals';

export async function initMealsDb() {
  // No-op for AsyncStorage, or verify access
  try {
    await AsyncStorage.getItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to access AsyncStorage during init', e);
  }
}

export async function insertMeal(meal: SavedMeal) {
  try {
    const meals = await getAllMeals();
    // Add to beginning (newest first)
    meals.unshift(meal);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
  } catch (e) {
    console.error('Failed to save meal', e);
    throw e;
  }
}

export async function getAllMeals(): Promise<SavedMeal[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    
    try {
      const meals: SavedMeal[] = JSON.parse(json);
      // Ensure sorted by date desc
      return meals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (parseError) {
      console.error('Failed to parse meals JSON, resetting storage:', parseError);
      // Reset storage if corrupted
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
  } catch (e) {
    console.error('Failed to load meals', e);
    return [];
  }
}

export async function getRecentMeals(limit: number = 10): Promise<SavedMeal[]> {
  const meals = await getAllMeals();
  return meals.slice(0, limit);
}

export async function getMealById(id: string): Promise<SavedMeal | null> {
  const meals = await getAllMeals();
  return meals.find(m => m.id === id) || null;
}

export async function getMealStats(): Promise<MealStats> {
  const meals = await getAllMeals();
  
  const totalMeals = meals.length;
  const totalCalories = meals.reduce((sum, m) => sum + (m.caloriesEstimate || 0), 0);
  const averageCalories = totalMeals > 0 ? Math.round(totalCalories / totalMeals) : 0;
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoTime = sevenDaysAgo.getTime();
  
  const last7DaysCalories = meals
    .filter(m => new Date(m.createdAt).getTime() >= sevenDaysAgoTime)
    .reduce((sum, m) => sum + (m.caloriesEstimate || 0), 0);
    
  return {
    totalMeals,
    totalCalories,
    averageCalories,
    last7DaysCalories,
  };
}

export async function getMealsByDateRange(startDateIso: string, endDateIso: string): Promise<SavedMeal[]> {
  const meals = await getAllMeals();
  const start = new Date(startDateIso).getTime();
  const end = new Date(endDateIso).getTime();
  
  return meals.filter(m => {
    const date = new Date(m.createdAt).getTime();
    return date >= start && date <= end;
  });
}

export async function getAllMealDates(): Promise<string[]> {
  const meals = await getAllMeals();
  return meals.map(m => m.createdAt);
}

export async function deleteMeal(id: string) {
  try {
    const meals = await getAllMeals();
    const filtered = meals.filter(m => m.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete meal', e);
    throw e;
  }
}

export async function deleteAllMeals() {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } catch (e) {
    console.error('Failed to delete all meals', e);
    throw e;
  }
}
