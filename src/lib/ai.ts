import type { MealSelection, MealPlan, DecidedMeal, WeeklyMealPlan } from '../types';
import { getCurrentSeason } from '../constants/seasonal';
import { useSubscriptionStore } from '../stores/subscriptionStore';

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = useSubscriptionStore.getState().token;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

const MEAL_TIME_LABELS: Record<string, string> = {
  breakfast: '朝食',
  lunch: '昼食',
  dinner: '夕食',
};

const GENRE_LABELS: Record<string, string> = {
  japanese: '和食',
  chinese: '中華',
  western: '洋食',
  korean: '韓国料理',
  italian: 'イタリアン',
  thai: 'タイ料理',
  indian: 'インド料理',
  mexican: 'メキシカン',
  ethnic: 'エスニック',
  random: 'おまかせ',
};

const MOOD_LABELS: Record<string, string> = {
  refreshing: 'さっぱり',
  hearty: 'がっつり',
  healthy: 'ヘルシー',
  rich: 'こってり',
  spicy: '辛い',
  salty: 'しょっぱい',
  sweet: '甘め',
};

const COOKING_TIME_LABELS: Record<string, string> = {
  quick: '15分以内',
  normal: '30分程度',
  slow: 'じっくり60分',
};

function buildSystemPrompt(): string {
  return `あなたは日本の家庭料理の専門家です。
ユーザーの希望に合わせて、主菜・副菜・汁物の3品からなる献立を提案してください。

各レシピには以下の情報を**必ず**含めてください：
- name: 料理名
- description: 簡単な説明（1文）
- ingredients: 材料リスト（{ name: string, amount: string }の配列）
- steps: 手順（文字列の配列）
- cookingTimeMinutes: 調理時間（分、数値）
- calories: おおよそのカロリー（数値）
- nutrition: 栄養成分（{ calories: number, protein: number, fat: number, carbs: number, fiber: number, salt: number }）
  - calories: kcal, protein/fat/carbs/fiber: g, salt: g
- rarity: レア度（"N"=定番家庭料理, "R"=ちょっと手の込んだ料理, "SR"=レストラン級, "SSR"=プロ級・映え料理）

**必ず**以下のJSON形式のみで返答してください。説明文やmarkdownは不要です：
{
  "main": { "name": "...", "description": "...", "rarity": "R", "ingredients": [{"name":"...","amount":"..."}], "steps": ["..."], "cookingTimeMinutes": 0, "calories": 0, "nutrition": {"calories":0,"protein":0,"fat":0,"carbs":0,"fiber":0,"salt":0} },
  "side": { ... },
  "soup": { ... }
}`;
}

function buildUserPrompt(
  selection: MealSelection,
  dislikedIngredients: string[],
  recentMeals: DecidedMeal[],
): string {
  let prompt = `以下の条件で献立を考えてください：
- 食事: ${MEAL_TIME_LABELS[selection.mealTime] ?? selection.mealTime}
- ジャンル: ${GENRE_LABELS[selection.genre] ?? selection.genre}
- 気分: ${selection.moods.map((m) => MOOD_LABELS[m] ?? m).join('、') || 'おまかせ'}
- 調理時間: ${COOKING_TIME_LABELS[selection.cookingTime] ?? selection.cookingTime}
- 人数: ${selection.servings}人分`;

  if (selection.dietMode) {
    prompt += `\n\n【ダイエットモード】3品合計で600kcal以内に抑えてください。高タンパク・低脂質を意識してください。`;
  }

  if (selection.bingeMode) {
    prompt += `\n\n【爆食モード】ボリューム満点の献立を提案してください。大盛り・こってり・ガツンとくる味付けでOK。カロリーは気にせず、満足感とインパクト重視で。揚げ物・肉料理・炭水化物たっぷりOK。`;
  }

  if (selection.beginnerMode) {
    prompt += `\n\n【初心者モード】料理初心者でも作れる簡単なレシピのみ提案してください。工程は5ステップ以内、特殊な調理器具は不要にしてください。`;
  }

  if (selection.gentleMode || selection.gentleOptions.length > 0) {
    const optionLabels: Record<string, string> = {
      easyDigest: '消化にやさしい食材を使い、揚げ物・刺激物・生ものを避けてください',
      lowSalt: '塩分を控えめに（1品あたり1.5g以下）、出汁や酸味で味を補ってください',
      lowCarb: '糖質を控えめに（1品あたり40g以下）、ごはん・麺・芋類は少なめに',
      lowFat: '脂質を控えめに（1品あたり10g以下）、揚げ物・脂身の多い肉は避けてください',
      lowProtein: 'たんぱく質を控えめに（1品あたり15g以下）、肉・魚は少量にしてください',
      lowPurine: 'プリン体の多い食材（内臓・エビ・干物・いわし・かつお）を避けてください',
    };
    const restrictions = selection.gentleOptions
      .map((o) => optionLabels[o])
      .filter(Boolean);
    if (restrictions.length > 0) {
      prompt += `\n\n【おだいじにモード】以下の食事制限を守ってください：\n${restrictions.map((r) => `- ${r}`).join('\n')}`;
    } else {
      prompt += `\n\n【おだいじにモード】体調がすぐれない時向けの、消化が良く体に優しいレシピを提案してください。`;
    }
  }

  // Seasonal ingredients hint
  const season = getCurrentSeason();
  if (season) {
    prompt += `\n\n【今月の旬食材】できれば以下の旬食材を使ってください：${season.ingredients.join('、')}`;
  }

  if (dislikedIngredients.length > 0) {
    prompt += `\n\n【NG食材】以下の食材は絶対に使わないでください：\n${dislikedIngredients.map((n) => `- ${n}`).join('\n')}`;
  }

  if (recentMeals.length > 0) {
    const recentNames = recentMeals.map((d) => {
      const date = new Date(d.decidedAt).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
      return `- ${d.mealPlan.main.name}（${date}）`;
    });
    prompt += `\n\n【最近作った料理】同じものは避けてください：\n${recentNames.join('\n')}`;
  }

  return prompt;
}

function parseMealPlanResponse(text: string): MealPlan {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const parsed = JSON.parse(cleaned);

  const validRarities = ['N', 'R', 'SR', 'SSR'];
  for (const key of ['main', 'side', 'soup'] as const) {
    const recipe = parsed[key];
    if (!recipe?.name || !recipe?.ingredients || !recipe?.steps) {
      throw new Error(`Invalid recipe data for ${key}`);
    }
    // Ensure rarity exists and is valid
    if (!recipe.rarity || !validRarities.includes(recipe.rarity)) {
      recipe.rarity = 'R';
    }
  }

  return {
    main: parsed.main,
    side: parsed.side,
    soup: parsed.soup,
    generatedAt: new Date().toISOString(),
  };
}

export async function generateWithAI(
  selection: MealSelection,
  dislikedIngredients: string[],
  recentMeals: DecidedMeal[],
): Promise<MealPlan> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: buildSystemPrompt(),
      messages: [
        { role: 'user', content: buildUserPrompt(selection, dislikedIngredients, recentMeals) },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find((b: { type: string }) => b.type === 'text');
  if (!textBlock?.text) {
    throw new Error('No text response from AI');
  }

  return parseMealPlanResponse(textBlock.text);
}

function buildWeeklySystemPrompt(): string {
  return `あなたは日本の家庭料理の専門家です。
1週間分（7日間）の献立を提案してください。各日に主菜・副菜・汁物の3品を含めてください。

**重要なルール：**
- 7日間で主菜が重複しないようにしてください
- 副菜・汁物もできるだけバラエティ豊かにしてください
- 和食・洋食・中華などジャンルを日ごとに変化させてください
- 栄養バランスを考慮してください

各レシピには以下の情報を**必ず**含めてください：
- name: 料理名
- description: 簡単な説明（1文）
- ingredients: 材料リスト（{ name: string, amount: string }の配列）
- steps: 手順（文字列の配列）
- cookingTimeMinutes: 調理時間（分、数値）
- calories: おおよそのカロリー（数値）
- nutrition: 栄養成分（{ calories: number, protein: number, fat: number, carbs: number, fiber: number, salt: number }）
  - calories: kcal, protein/fat/carbs/fiber: g, salt: g
- rarity: レア度（"N"=定番家庭料理, "R"=ちょっと手の込んだ料理, "SR"=レストラン級, "SSR"=プロ級・映え料理）

**必ず**以下のJSON形式のみで返答してください。説明文やmarkdownは不要です：
[
  { "main": { ... }, "side": { ... }, "soup": { ... } },
  { "main": { ... }, "side": { ... }, "soup": { ... } },
  ...（7日分）
]`;
}

function parseWeeklyResponse(text: string): MealPlan[] {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed) || parsed.length !== 7) {
    throw new Error('Expected array of 7 meal plans');
  }

  const validRarities = ['N', 'R', 'SR', 'SSR'];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return parsed.map((day: any, i: number) => {
    for (const key of ['main', 'side', 'soup'] as const) {
      const recipe = day[key];
      if (!recipe?.name || !recipe?.ingredients || !recipe?.steps) {
        throw new Error(`Invalid recipe data for day ${i + 1} ${key}`);
      }
      if (!recipe.rarity || !validRarities.includes(recipe.rarity)) {
        recipe.rarity = 'R';
      }
    }
    return {
      main: day.main,
      side: day.side,
      soup: day.soup,
      generatedAt: new Date().toISOString(),
    } as MealPlan;
  });
}

export async function generateWeeklyWithAI(
  dislikedIngredients: string[],
  recentMeals: DecidedMeal[],
): Promise<WeeklyMealPlan> {
  let userPrompt = '1週間分の献立を考えてください。';

  if (dislikedIngredients.length > 0) {
    userPrompt += `\n\n【NG食材】以下の食材は絶対に使わないでください：\n${dislikedIngredients.map((n) => `- ${n}`).join('\n')}`;
  }

  if (recentMeals.length > 0) {
    const recentNames = recentMeals.map((d) => {
      const date = new Date(d.decidedAt).toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' });
      return `- ${d.mealPlan.main.name}（${date}）`;
    });
    userPrompt += `\n\n【最近作った料理】同じものは避けてください：\n${recentNames.join('\n')}`;
  }

  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      system: buildWeeklySystemPrompt(),
      messages: [
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find((b: { type: string }) => b.type === 'text');
  if (!textBlock?.text) {
    throw new Error('No text response from AI');
  }

  const plans = parseWeeklyResponse(textBlock.text);

  const today = new Date();
  const days = plans.map((plan, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    return { date: date.toISOString().slice(0, 10), plan };
  });

  return {
    days,
    generatedAt: new Date().toISOString(),
  };
}
