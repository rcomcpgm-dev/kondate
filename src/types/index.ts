export type MealTime = 'breakfast' | 'lunch' | 'dinner';
export type Genre =
  | 'japanese' | 'chinese' | 'western' | 'korean' | 'ethnic'
  | 'italian' | 'thai' | 'indian' | 'mexican'
  | 'random';
export type Mood = 'refreshing' | 'hearty' | 'healthy' | 'rich' | 'spicy' | 'salty' | 'sweet';
export type CookingTime = 'quick' | 'normal' | 'slow';
export type Servings = 1 | 2 | 4;
export type SubscriptionTier = 'free' | 'premium';
export type Rarity = 'N' | 'R' | 'SR' | 'SSR';
export type Difficulty = 'beginner' | 'normal' | 'advanced';

export type GentleOption =
  | 'easyDigest'   // 消化にやさしい（風邪・胃腸）
  | 'lowSalt'      // 塩分ひかえめ（高血圧）
  | 'lowCarb'      // 糖質ひかえめ（糖尿病）
  | 'lowFat'       // 脂質ひかえめ（脂質異常症）
  | 'lowProtein'   // たんぱく質ひかえめ（腎臓病）
  | 'lowPurine';   // プリン体ひかえめ（痛風）

export interface MealSelection {
  mealTime: MealTime;
  genre: Genre;
  moods: Mood[];
  cookingTime: CookingTime;
  servings: Servings;
  dietMode: boolean;
  beginnerMode: boolean;
  gentleMode: boolean;
  gentleOptions: GentleOption[];
}

export interface Recipe {
  name: string;
  description: string;
  ingredients: { name: string; amount: string }[];
  steps: string[];
  cookingTimeMinutes: number;
  calories?: number;
  nutrition?: NutritionInfo;
  rarity: Rarity;
  difficulty?: Difficulty;
}

export interface IngredientSubstitution {
  original: string;
  substitute: string;
  excludeRecipes?: string[];
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number;
  salt: number;
}

export interface MealPlan {
  main: Recipe;
  side: Recipe;
  soup: Recipe;
  generatedAt: string;
}

export interface DislikedIngredient {
  name: string;
  addedAt: string;
}

export interface DecidedMeal {
  mealPlan: MealPlan;
  decidedAt: string;
}
