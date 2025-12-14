import AsyncStorage from '@react-native-async-storage/async-storage';

export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type GoalType = "lose_weight" | "maintain" | "gain_weight";

export interface UserProfile {
  id: string;               // can be "default" or UUID
  name: string;
  age: number | null;
  sex: "male" | "female" | "other" | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: ActivityLevel;
  goal: GoalType;
  calorieTarget: number;    // daily kcal target
  proteinTarget: number;    // grams per day (optional but nice)
  carbsTarget: number;      // grams per day
  fatsTarget: number;       // grams per day
}

const STORAGE_KEY = 'user_profile';

export const DEFAULT_PROFILE: UserProfile = {
  id: 'default',
  name: 'Guest',
  age: null,
  sex: null,
  heightCm: null,
  weightKg: null,
  activityLevel: 'moderate',
  goal: 'maintain',
  calorieTarget: 2000,
  proteinTarget: 125, // 2000 * 0.25 / 4
  carbsTarget: 250,   // 2000 * 0.50 / 4
  fatsTarget: 55,     // 2000 * 0.25 / 9
};

export async function getUserProfile(): Promise<UserProfile> {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    if (jsonValue != null) {
      try {
        return JSON.parse(jsonValue);
      } catch (parseError) {
        console.error('Error parsing user profile JSON, resetting to default:', parseError);
        // Reset to default if corrupted
        await saveUserProfile(DEFAULT_PROFILE);
        return DEFAULT_PROFILE;
      }
    }
    return DEFAULT_PROFILE;
  } catch (e) {
    console.error('Error reading user profile', e);
    return DEFAULT_PROFILE;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    const jsonValue = JSON.stringify(profile);
    await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
  } catch (e) {
    console.error('Error saving user profile', e);
    throw e;
  }
}

export function calculateTargets(
  profile: UserProfile
): { calorieTarget: number; protein: number; carbs: number; fats: number } {
  // Defaults if data is missing
  let calorieTarget = 2000;
  const weight = profile.weightKg || 70;
  const height = profile.heightCm || 170;
  const age = profile.age || 30;
  const sex = profile.sex || 'male';

  // Mifflin-St Jeor Equation
  // P = 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) + s
  let bmr = 10 * weight + 6.25 * height - 5 * age;

  if (sex === 'female') {
    bmr -= 161;
  } else {
    bmr += 5; // Male or Other (assume male base for other or average)
  }

  // Activity Multipliers
  let multiplier = 1.2;
  switch (profile.activityLevel) {
    case 'sedentary': multiplier = 1.2; break;
    case 'light': multiplier = 1.375; break;
    case 'moderate': multiplier = 1.55; break;
    case 'active': multiplier = 1.725; break;
    case 'very_active': multiplier = 1.9; break;
  }

  let tdee = bmr * multiplier;

  // Goal adjustment
  if (profile.goal === 'lose_weight') {
    tdee -= 500;
  } else if (profile.goal === 'gain_weight') {
    tdee += 500;
  }

  // Ensure reasonable limits (e.g., not below 1200)
  calorieTarget = Math.max(1200, Math.round(tdee));

  // Calculate macros (Protein 25%, Carbs 50%, Fats 25%)
  const protein = Math.round((calorieTarget * 0.25) / 4);
  const carbs = Math.round((calorieTarget * 0.50) / 4);
  const fats = Math.round((calorieTarget * 0.25) / 9);

  return {
    calorieTarget,
    protein,
    carbs,
    fats,
  };
}
