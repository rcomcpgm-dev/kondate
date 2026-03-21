import type { IngredientSubstitution } from '../types';

// Ingredient substitution rules
// excludeRecipes: recipes where this swap would break the dish identity
export const SUBSTITUTIONS: IngredientSubstitution[] = [
  // Vegetables
  { original: 'キャベツ', substitute: '白菜', excludeRecipes: ['ロールキャベツ', 'コールスロー'] },
  { original: '白菜', substitute: 'キャベツ', excludeRecipes: ['白菜の浅漬け'] },
  { original: 'ほうれん草', substitute: '小松菜' },
  { original: '小松菜', substitute: 'ほうれん草' },
  { original: 'ピーマン', substitute: 'パプリカ' },
  { original: 'パプリカ', substitute: 'ピーマン' },
  { original: '赤パプリカ', substitute: 'ピーマン' },
  { original: '長ねぎ', substitute: '玉ねぎ' },
  { original: 'なす', substitute: 'ズッキーニ' },
  { original: 'ズッキーニ', substitute: 'なす' },
  { original: 'にんじん', substitute: '大根' },
  { original: 'ごぼう', substitute: 'れんこん' },
  { original: 'れんこん', substitute: 'ごぼう' },
  { original: 'もやし', substitute: '豆苗' },
  { original: '豆苗', substitute: 'もやし' },
  { original: 'ニラ', substitute: 'ねぎ' },
  { original: 'セロリ', substitute: '三つ葉' },
  { original: 'トマト', substitute: 'ミニトマト' },

  // Mushrooms
  { original: 'しめじ', substitute: 'えのき' },
  { original: 'えのき', substitute: 'しめじ' },
  { original: 'まいたけ', substitute: 'エリンギ' },
  { original: 'エリンギ', substitute: 'まいたけ' },

  // Proteins
  { original: '鶏もも肉', substitute: '鶏むね肉' },
  { original: '鶏むね肉', substitute: '鶏もも肉' },
  { original: '豚バラ薄切り', substitute: '豚ロース薄切り' },
  { original: '豚ロース薄切り', substitute: '豚バラ薄切り' },
  { original: '牛薄切り肉', substitute: '豚薄切り肉' },
  { original: '豚ひき肉', substitute: '鶏ひき肉' },
  { original: '鶏ひき肉', substitute: '豚ひき肉' },
  { original: '合いびき肉', substitute: '豚ひき肉' },
  { original: 'むきエビ', substitute: 'イカ' },
  { original: 'サバ切り身', substitute: 'ブリ切り身', excludeRecipes: ['サバの味噌煮'] },
  { original: '生サーモン', substitute: 'タラ' },
  { original: '塩鮭切り身', substitute: '塩サバ切り身' },
  { original: 'ベーコン', substitute: 'ウインナー' },
  { original: 'ハム', substitute: 'カニカマ' },

  // Tofu
  { original: '絹豆腐', substitute: '木綿豆腐' },
  { original: '木綿豆腐', substitute: '絹豆腐' },
];

/**
 * Find available substitutions for a given ingredient in a given recipe.
 * Returns empty array if no substitutions are available.
 */
export function getSubstitutions(
  ingredientName: string,
  recipeName: string,
): IngredientSubstitution[] {
  return SUBSTITUTIONS.filter(
    (s) =>
      s.original === ingredientName &&
      !(s.excludeRecipes ?? []).includes(recipeName),
  );
}
