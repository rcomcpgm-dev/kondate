/**
 * 旬食材データ — 月ごとの旬の食材リスト
 */

export type SeasonalData = {
  ingredients: string[];
  label: string;
};

export const SEASONAL_INGREDIENTS: Record<number, SeasonalData> = {
  1:  { ingredients: ['白菜', '大根', 'ブリ', 'みかん', '春菊', 'ほうれん草'], label: '1月の旬' },
  2:  { ingredients: ['白菜', '菜の花', 'カキ', 'ふきのとう', 'いちご', 'ほうれん草'], label: '2月の旬' },
  3:  { ingredients: ['菜の花', 'たけのこ', 'あさり', '新玉ねぎ', 'いちご', 'わかめ'], label: '3月の旬' },
  4:  { ingredients: ['たけのこ', 'アスパラ', '鯛', '新じゃが', 'そら豆', 'スナップえんどう'], label: '4月の旬' },
  5:  { ingredients: ['アスパラ', 'そら豆', 'カツオ', '新生姜', 'トマト', 'きぬさや'], label: '5月の旬' },
  6:  { ingredients: ['トマト', 'きゅうり', 'アジ', '梅', '枝豆', 'みょうが'], label: '6月の旬' },
  7:  { ingredients: ['トマト', 'なす', 'きゅうり', 'うなぎ', 'とうもろこし', '枝豆', 'ゴーヤ'], label: '7月の旬' },
  8:  { ingredients: ['なす', 'オクラ', 'すいか', '桃', 'ゴーヤ', 'みょうが'], label: '8月の旬' },
  9:  { ingredients: ['さんま', '栗', 'きのこ類', 'さつまいも', '梨', 'かぼす'], label: '9月の旬' },
  10: { ingredients: ['さんま', 'きのこ類', '栗', '柿', 'れんこん', 'さつまいも'], label: '10月の旬' },
  11: { ingredients: ['白菜', '大根', 'りんご', 'ゆず', 'かぶ', 'ごぼう'], label: '11月の旬' },
  12: { ingredients: ['白菜', '大根', 'ブリ', 'カニ', 'ゆず', 'みかん'], label: '12月の旬' },
};

/**
 * 現在の月の旬食材データを返す
 */
export function getCurrentSeason(): SeasonalData {
  const month = new Date().getMonth() + 1; // 0-indexed → 1-indexed
  return SEASONAL_INGREDIENTS[month];
}

/**
 * 指定月の旬食材を表示用ラベルとして返す
 * 例: "3月の旬: 菜の花・たけのこ・あさり"
 */
export function getSeasonalLabel(month: number): string {
  const data = SEASONAL_INGREDIENTS[month];
  if (!data) return '';
  return `${month}月の旬: ${data.ingredients.join('・')}`;
}
