import * as SQLite from 'expo-sqlite';

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

let db: SQLite.SQLiteDatabase | null = null;

async function getDb() {
  if (!db) {
    db = await SQLite.openDatabaseAsync('meals.db');
  }
  return db;
}

function parseJsonSafely<T>(json: string | null | undefined, defaultValue: T, mealId?: string, fieldName?: string): T {
  try {
    if (!json) return defaultValue;
    return JSON.parse(json);
  } catch (e) {
    console.error(`Failed to parse ${fieldName || 'JSON'} for meal ${mealId || 'unknown'}:`, e);
    return defaultValue;
  }
}

function rowToMeal(row: any): SavedMeal {
  return {
    id: row.id,
    imageUri: row.imageUri,
    createdAt: row.createdAt,
    dishName: row.dishName,
    ingredientsDescription: row.ingredientsDescription,
    nutritionSummary: row.nutritionSummary,
    caloriesEstimate: row.caloriesEstimate,
    proteinGrams: row.proteinGrams,
    carbsGrams: row.carbsGrams,
    fatGrams: row.fatGrams,
    fiberGrams: row.fiberGrams,
    goodPoints: parseJsonSafely(row.goodPointsJson, [], row.id, 'goodPoints'),
    badPoints: parseJsonSafely(row.badPointsJson, [], row.id, 'badPoints'),
  };
}

export async function initMealsDb() {
  const database = await getDb();
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS meals (
      id TEXT PRIMARY KEY,
      imageUri TEXT,
      createdAt TEXT,
      dishName TEXT,
      ingredientsDescription TEXT,
      nutritionSummary TEXT,
      caloriesEstimate REAL,
      proteinGrams REAL,
      carbsGrams REAL,
      fatGrams REAL,
      fiberGrams REAL,
      goodPointsJson TEXT,
      badPointsJson TEXT
    );
  `);
}

export async function insertMeal(meal: SavedMeal) {
  const database = await getDb();
  await database.runAsync(
    `INSERT INTO meals (
      id, imageUri, createdAt, dishName, ingredientsDescription, nutritionSummary,
      caloriesEstimate, proteinGrams, carbsGrams, fatGrams, fiberGrams,
      goodPointsJson, badPointsJson
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      meal.id,
      meal.imageUri,
      meal.createdAt,
      meal.dishName,
      meal.ingredientsDescription,
      meal.nutritionSummary,
      meal.caloriesEstimate,
      meal.proteinGrams,
      meal.carbsGrams,
      meal.fatGrams,
      meal.fiberGrams,
      JSON.stringify(meal.goodPoints),
      JSON.stringify(meal.badPoints),
    ]
  );
}

export async function updateMeal(meal: SavedMeal) {
  const database = await getDb();
  await database.runAsync(
    `UPDATE meals SET
      imageUri = ?,
      createdAt = ?,
      dishName = ?,
      ingredientsDescription = ?,
      nutritionSummary = ?,
      caloriesEstimate = ?,
      proteinGrams = ?,
      carbsGrams = ?,
      fatGrams = ?,
      fiberGrams = ?,
      goodPointsJson = ?,
      badPointsJson = ?
    WHERE id = ?`,
    [
      meal.imageUri,
      meal.createdAt,
      meal.dishName,
      meal.ingredientsDescription,
      meal.nutritionSummary,
      meal.caloriesEstimate,
      meal.proteinGrams,
      meal.carbsGrams,
      meal.fatGrams,
      meal.fiberGrams,
      JSON.stringify(meal.goodPoints),
      JSON.stringify(meal.badPoints),
      meal.id,
    ]
  );
}

export async function deleteMeal(id: string) {
  const database = await getDb();
  await database.runAsync('DELETE FROM meals WHERE id = ?', [id]);
}

export async function deleteAllMeals() {
  const database = await getDb();
  await database.runAsync('DELETE FROM meals');
}

export async function getRecentMeals(limit: number = 10): Promise<SavedMeal[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<any>(
    'SELECT * FROM meals ORDER BY createdAt DESC LIMIT ?',
    [limit]
  );
  
  return rows.map(rowToMeal);
}

export async function getAllMeals(): Promise<SavedMeal[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<any>('SELECT * FROM meals ORDER BY createdAt DESC');
  
  return rows.map(rowToMeal);
}

export async function getMealById(id: string): Promise<SavedMeal | null> {
  const database = await getDb();
  const row = await database.getFirstAsync<any>('SELECT * FROM meals WHERE id = ?', [id]);
  
  if (!row) return null;

  return rowToMeal(row);
}

export async function getMealStats(): Promise<MealStats> {
  const database = await getDb();
  
  const totalResult = await database.getFirstAsync<{ count: number, totalCals: number, avgCals: number }>(
    'SELECT COUNT(*) as count, SUM(caloriesEstimate) as totalCals, AVG(caloriesEstimate) as avgCals FROM meals'
  );

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const isoSevenDaysAgo = sevenDaysAgo.toISOString();

  const recentResult = await database.getFirstAsync<{ recentCals: number }>(
    'SELECT SUM(caloriesEstimate) as recentCals FROM meals WHERE createdAt >= ?',
    [isoSevenDaysAgo]
  );

  return {
    totalMeals: totalResult?.count || 0,
    totalCalories: totalResult?.totalCals || 0,
    averageCalories: Math.round(totalResult?.avgCals || 0),
    last7DaysCalories: recentResult?.recentCals || 0,
  };
}

export async function getMealsByDateRange(startDateIso: string, endDateIso: string): Promise<SavedMeal[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<any>(
    'SELECT * FROM meals WHERE createdAt >= ? AND createdAt <= ? ORDER BY createdAt DESC',
    [startDateIso, endDateIso]
  );
  
  return rows.map(rowToMeal);
}

export async function getAllMealDates(): Promise<string[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{ createdAt: string }>('SELECT createdAt FROM meals ORDER BY createdAt DESC');
  return rows.map(r => r.createdAt);
}
