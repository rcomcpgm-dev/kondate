export const MEAL_TIMES = [
  { id: 'breakfast', label: '朝ごはん', emoji: '🌅' },
  { id: 'lunch', label: '昼ごはん', emoji: '☀️' },
  { id: 'dinner', label: '夕ごはん', emoji: '🌙' },
] as const;

export const GENRES = [
  { id: 'japanese', label: '和食', emoji: '🍱' },
  { id: 'chinese', label: '中華', emoji: '🥟' },
  { id: 'western', label: '洋食', emoji: '🍝' },
  { id: 'korean', label: '韓国', emoji: '🌶️' },
  { id: 'italian', label: 'イタリアン', emoji: '🍕' },
  { id: 'thai', label: 'タイ', emoji: '🥘' },
  { id: 'indian', label: 'インド', emoji: '🍛' },
  { id: 'mexican', label: 'メキシカン', emoji: '🌮' },
  { id: 'ethnic', label: 'エスニック', emoji: '🍜' },
  { id: 'random', label: 'おまかせ', emoji: '🎲' },
] as const;

export const MOODS = [
  { id: 'refreshing', label: 'さっぱり', emoji: '🧊' },
  { id: 'hearty', label: 'がっつり', emoji: '🔥' },
  { id: 'healthy', label: 'ヘルシー', emoji: '🥬' },
  { id: 'rich', label: 'こってり', emoji: '🧈' },
  { id: 'spicy', label: 'ピリ辛', emoji: '🌶️' },
  { id: 'salty', label: 'しょっぱい系', emoji: '🧂' },
  { id: 'sweet', label: '甘め', emoji: '🍯' },
] as const;

export const COOKING_TIMES = [
  { id: 'quick', label: '15分以内', emoji: '⚡', description: 'パパっと' },
  { id: 'normal', label: '30分くらい', emoji: '🕐', description: 'ふつう' },
  { id: 'slow', label: '1時間〜', emoji: '🍲', description: 'じっくり' },
] as const;

export const SERVINGS_OPTIONS = [
  { id: 1 as const, label: '1人分', emoji: '👤' },
  { id: 2 as const, label: '2人分', emoji: '👥' },
  { id: 4 as const, label: '3〜4人分', emoji: '👨‍👩‍👧‍👦' },
] as const;

// Diet mode calorie targets (total meal: main + side + soup)
export const DIET_CALORIE_TARGET = 600; // kcal per meal
