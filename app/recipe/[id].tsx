import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMealStore } from '../../src/stores/mealStore';
import { useSubscriptionStore } from '../../src/stores/subscriptionStore';
import { usePreferencesStore } from '../../src/stores/preferencesStore';
import { useFavoritesStore } from '../../src/stores/favoritesStore';
import { AdBanner } from '../../src/components/AdBanner';
import { RARITY_CONFIG, rarityStars } from '../../src/constants/rarity';
import { RarityBadge } from '../../src/components/RarityBadge';
import { getSubstitutions } from '../../src/constants/substitutions';
import { STATIC_RECIPES } from '../../src/data/recipes';
import type { Recipe } from '../../src/types';

const MEAL_TYPES = ['main', 'side', 'soup'] as const;
type MealType = (typeof MEAL_TYPES)[number];

function isMealType(id: string): id is MealType {
  return MEAL_TYPES.includes(id as MealType);
}

// --- SEO for static recipes (web only) ---
function useRecipeSEO(recipe: (typeof STATIC_RECIPES)[0] | undefined) {
  useEffect(() => {
    if (Platform.OS !== 'web' || !recipe) return;

    const TITLE = `${recipe.name}のレシピ｜献立ガチャ`;
    const DESC = recipe.description;
    const URL = `https://kondate-nu.vercel.app/recipe/${recipe.slug}`;
    const IMAGE = `https://kondate-nu.vercel.app/api/og-image?recipe=${encodeURIComponent(recipe.name)}&rarity=${recipe.rarity}&calories=${recipe.calories}&time=${recipe.cookingTimeMinutes}`;

    document.title = TITLE;

    const setMeta = (name: string, content: string, attr = 'name') => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta('description', DESC);
    setMeta('og:title', TITLE, 'property');
    setMeta('og:description', DESC, 'property');
    setMeta('og:url', URL, 'property');
    setMeta('og:image', IMAGE, 'property');
    setMeta('og:type', 'article', 'property');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', TITLE);
    setMeta('twitter:description', DESC);
    setMeta('twitter:image', IMAGE);

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Recipe',
      name: recipe.name,
      description: recipe.description,
      cookTime: `PT${recipe.cookingTimeMinutes}M`,
      recipeYield: `${recipe.servings}人分`,
      recipeCategory: recipe.genre,
      recipeIngredient: recipe.ingredients.map((i) => `${i.name} ${i.amount}`),
      recipeInstructions: recipe.steps.map((step, idx) => ({
        '@type': 'HowToStep',
        position: idx + 1,
        text: step,
      })),
      nutrition: {
        '@type': 'NutritionInformation',
        calories: `${recipe.calories} kcal`,
        proteinContent: `${recipe.nutrition.protein}g`,
        fatContent: `${recipe.nutrition.fat}g`,
        carbohydrateContent: `${recipe.nutrition.carbs}g`,
        fiberContent: `${recipe.nutrition.fiber}g`,
        sodiumContent: `${recipe.nutrition.salt}g`,
      },
      url: URL,
      image: IMAGE,
    };

    let scriptEl = document.getElementById('recipe-jsonld') as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = 'recipe-jsonld';
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify(schema);

    return () => {
      scriptEl?.remove();
    };
  }, [recipe]);
}

// =============================================================
// Gacha Recipe Detail (main / side / soup)
// =============================================================
function GachaRecipeDetail({ type }: { type: MealType }) {
  const router = useRouter();
  const result = useMealStore((s) => s.result);
  const isPremium = useSubscriptionStore((s) => s.isPremium());
  const { isDisliked, addDisliked, removeDisliked } = usePreferencesStore();
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [substitutions, setSubstitutions] = useState<Record<number, string>>({});
  const [toastVisible, setToastVisible] = useState(false);

  if (!result) {
    return (
      <View style={gachaStyles.errorContainer}>
        <Text style={gachaStyles.errorText}>レシピが見つかりません</Text>
        <TouchableOpacity style={gachaStyles.backBtn} onPress={() => router.back()}>
          <Text style={gachaStyles.backBtnText}>戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const LABELS: Record<MealType, { label: string; emoji: string }> = {
    main: { label: '主菜', emoji: '🍖' },
    side: { label: '副菜', emoji: '🥗' },
    soup: { label: '汁物', emoji: '🍜' },
  };
  const recipe: Recipe = result[type];
  const { label, emoji } = LABELS[type];

  const toggleIngredient = (index: number) => {
    Haptics.selectionAsync();
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleToggleDislike = (ingredientName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isDisliked(ingredientName)) {
      removeDisliked(ingredientName);
    } else {
      Alert.alert(
        'NG食材に追加',
        `「${ingredientName}」を苦手な食材に登録しますか？\n次回のガチャから除外されます。`,
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: '追加する',
            style: 'destructive',
            onPress: () => addDisliked(ingredientName),
          },
        ],
      );
    }
  };

  const handleSubstitute = (index: number, ingredientName: string) => {
    const subs = getSubstitutions(ingredientName, recipe.name);
    if (subs.length === 0) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (subs.length === 1) {
      if (substitutions[index]) {
        setSubstitutions((prev) => {
          const next = { ...prev };
          delete next[index];
          return next;
        });
      } else {
        setSubstitutions((prev) => ({ ...prev, [index]: subs[0].substitute }));
      }
    } else {
      Alert.alert(
        '食材を置き換え',
        `「${ingredientName}」の代わりに：`,
        [
          ...subs.map((s) => ({
            text: s.substitute,
            onPress: () => setSubstitutions((prev) => ({ ...prev, [index]: s.substitute })),
          })),
          ...(substitutions[index]
            ? [{
                text: '元に戻す',
                style: 'cancel' as const,
                onPress: () =>
                  setSubstitutions((prev) => {
                    const next = { ...prev };
                    delete next[index];
                    return next;
                  }),
              }]
            : [{ text: 'キャンセル', style: 'cancel' as const }]),
        ],
      );
    }
  };

  const favorited = isFavorite(recipe.name);

  const handleToggleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (favorited) {
      removeFavorite(recipe.name);
    } else {
      addFavorite(recipe, type);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 1800);
    }
  };

  const totalNutrition = recipe.nutrition;
  const mealNutrition =
    result.main.nutrition && result.side.nutrition && result.soup.nutrition
      ? {
          calories:
            result.main.nutrition.calories +
            result.side.nutrition.calories +
            result.soup.nutrition.calories,
          protein:
            result.main.nutrition.protein +
            result.side.nutrition.protein +
            result.soup.nutrition.protein,
          fat:
            result.main.nutrition.fat +
            result.side.nutrition.fat +
            result.soup.nutrition.fat,
          carbs:
            result.main.nutrition.carbs +
            result.side.nutrition.carbs +
            result.soup.nutrition.carbs,
          fiber:
            result.main.nutrition.fiber +
            result.side.nutrition.fiber +
            result.soup.nutrition.fiber,
          salt:
            result.main.nutrition.salt +
            result.side.nutrition.salt +
            result.soup.nutrition.salt,
        }
      : null;

  return (
    <ScrollView
      style={gachaStyles.container}
      contentContainerStyle={gachaStyles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={gachaStyles.topRow}>
        <TouchableOpacity style={gachaStyles.backButton} onPress={() => router.back()}>
          <Text style={gachaStyles.backButtonText}>← 戻る</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={gachaStyles.favoriteButton}
          onPress={handleToggleFavorite}
          activeOpacity={0.7}
        >
          <Text style={gachaStyles.favoriteButtonText}>{favorited ? '♥' : '♡'}</Text>
        </TouchableOpacity>
      </View>

      {toastVisible && (
        <View style={gachaStyles.toast}>
          <Text style={gachaStyles.toastText}>お気に入りに追加しました</Text>
        </View>
      )}

      <View style={gachaStyles.header}>
        <View style={gachaStyles.labelRow}>
          <View style={gachaStyles.labelBadge}>
            <Text style={gachaStyles.labelBadgeText}>{emoji} {label}</Text>
          </View>
          <RarityBadge rarity={recipe.rarity} size="small" />
          {recipe.difficulty === 'beginner' && (
            <View style={gachaStyles.beginnerBadge}>
              <Text style={gachaStyles.beginnerBadgeText}>🔰 初心者OK</Text>
            </View>
          )}
        </View>
        <Text style={gachaStyles.recipeName}>{recipe.name}</Text>
        <Text style={gachaStyles.recipeDescription}>{recipe.description}</Text>
      </View>

      {/* Badges */}
      <View style={gachaStyles.badgeRow}>
        <View style={gachaStyles.infoBadge}>
          <Text style={gachaStyles.infoBadgeText}>⏱️ {recipe.cookingTimeMinutes}分</Text>
        </View>
        {recipe.calories != null && (
          <View style={gachaStyles.infoBadge}>
            <Text style={gachaStyles.infoBadgeText}>🔥 {recipe.calories}kcal</Text>
          </View>
        )}
      </View>

      {/* Nutrition Info (per dish) */}
      {totalNutrition && (
        <View style={gachaStyles.nutritionCard}>
          <Text style={gachaStyles.nutritionTitle}>📊 栄養成分（1人分）</Text>
          <View style={gachaStyles.nutritionGrid}>
            <View style={gachaStyles.nutritionItem}>
              <Text style={gachaStyles.nutritionValue}>{totalNutrition.calories}</Text>
              <Text style={gachaStyles.nutritionLabel}>kcal</Text>
            </View>
            <View style={gachaStyles.nutritionItem}>
              <Text style={gachaStyles.nutritionValue}>{totalNutrition.protein}g</Text>
              <Text style={gachaStyles.nutritionLabel}>たんぱく質</Text>
            </View>
            <View style={gachaStyles.nutritionItem}>
              <Text style={gachaStyles.nutritionValue}>{totalNutrition.fat}g</Text>
              <Text style={gachaStyles.nutritionLabel}>脂質</Text>
            </View>
            <View style={gachaStyles.nutritionItem}>
              <Text style={gachaStyles.nutritionValue}>{totalNutrition.carbs}g</Text>
              <Text style={gachaStyles.nutritionLabel}>炭水化物</Text>
            </View>
            <View style={gachaStyles.nutritionItem}>
              <Text style={gachaStyles.nutritionValue}>{totalNutrition.fiber}g</Text>
              <Text style={gachaStyles.nutritionLabel}>食物繊維</Text>
            </View>
            <View style={gachaStyles.nutritionItem}>
              <Text style={gachaStyles.nutritionValue}>{totalNutrition.salt}g</Text>
              <Text style={gachaStyles.nutritionLabel}>塩分</Text>
            </View>
          </View>
        </View>
      )}

      {/* Total Meal Nutrition */}
      {mealNutrition && (
        <View style={gachaStyles.mealNutritionCard}>
          <Text style={gachaStyles.mealNutritionTitle}>📋 献立合計（3品）</Text>
          <View style={gachaStyles.mealNutritionRow}>
            <View style={gachaStyles.mealNutritionItem}>
              <Text style={gachaStyles.mealNutritionValue}>{mealNutrition.calories}</Text>
              <Text style={gachaStyles.mealNutritionLabel}>kcal</Text>
            </View>
            <View style={gachaStyles.mealNutritionItem}>
              <Text style={gachaStyles.mealNutritionValue}>P {mealNutrition.protein}g</Text>
              <Text style={gachaStyles.mealNutritionLabel}>たんぱく質</Text>
            </View>
            <View style={gachaStyles.mealNutritionItem}>
              <Text style={gachaStyles.mealNutritionValue}>F {mealNutrition.fat}g</Text>
              <Text style={gachaStyles.mealNutritionLabel}>脂質</Text>
            </View>
            <View style={gachaStyles.mealNutritionItem}>
              <Text style={gachaStyles.mealNutritionValue}>C {mealNutrition.carbs}g</Text>
              <Text style={gachaStyles.mealNutritionLabel}>炭水化物</Text>
            </View>
          </View>
        </View>
      )}

      {/* Ingredients */}
      <View style={gachaStyles.section}>
        <Text style={gachaStyles.sectionTitle}>🛒 材料</Text>
        <Text style={gachaStyles.sectionHint}>長押しでNG食材に登録 ・ タップで🔄置き換え</Text>
        <View style={gachaStyles.ingredientsList}>
          {recipe.ingredients.map((ing, i) => {
            const isChecked = checkedIngredients.has(i);
            const disliked = isDisliked(ing.name);
            const isSubstituted = !!substitutions[i];
            const displayName = substitutions[i] ?? ing.name;
            const hasSubs = getSubstitutions(ing.name, recipe.name).length > 0;

            return (
              <TouchableOpacity
                key={i}
                style={[
                  gachaStyles.ingredientRow,
                  disliked && gachaStyles.ingredientRowDisliked,
                  isSubstituted && gachaStyles.ingredientRowSubstituted,
                ]}
                onPress={() => toggleIngredient(i)}
                onLongPress={() => handleToggleDislike(ing.name)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    gachaStyles.checkbox,
                    isChecked && gachaStyles.checkboxChecked,
                  ]}
                >
                  {isChecked && <Text style={gachaStyles.checkmark}>✓</Text>}
                </View>
                <Text
                  style={[
                    gachaStyles.ingredientName,
                    isChecked && gachaStyles.ingredientChecked,
                    isSubstituted && gachaStyles.ingredientSubstituted,
                  ]}
                >
                  {isSubstituted ? `${displayName}` : ing.name}
                  {isSubstituted && (
                    <Text style={gachaStyles.originalIngredient}>{` (元: ${ing.name})`}</Text>
                  )}
                </Text>
                {disliked && (
                  <TouchableOpacity
                    style={gachaStyles.ngBadge}
                    onPress={() => {
                      Haptics.selectionAsync();
                      removeDisliked(ing.name);
                    }}
                  >
                    <Text style={gachaStyles.ngBadgeText}>NG</Text>
                  </TouchableOpacity>
                )}
                {hasSubs && !isChecked && (
                  <TouchableOpacity
                    style={gachaStyles.swapBtn}
                    onPress={() => handleSubstitute(i, ing.name)}
                  >
                    <Text style={gachaStyles.swapBtnText}>🔄</Text>
                  </TouchableOpacity>
                )}
                <Text
                  style={[
                    gachaStyles.ingredientAmount,
                    isChecked && gachaStyles.ingredientChecked,
                  ]}
                >
                  {ing.amount}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Steps */}
      <View style={gachaStyles.section}>
        <Text style={gachaStyles.sectionTitle}>📝 作り方</Text>
        <View style={gachaStyles.stepsList}>
          {recipe.steps.map((step, i) => (
            <View key={i} style={gachaStyles.stepRow}>
              <View style={gachaStyles.stepNumber}>
                <Text style={gachaStyles.stepNumberText}>{i + 1}</Text>
              </View>
              <Text style={gachaStyles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Video Search */}
      <View style={gachaStyles.section}>
        <Text style={gachaStyles.sectionTitle}>🎬 動画で見る</Text>
        <View style={gachaStyles.videoRow}>
          <TouchableOpacity
            style={gachaStyles.youtubeBtn}
            onPress={() => {
              Haptics.selectionAsync();
              const q = encodeURIComponent(`${recipe.name} 作り方`);
              Linking.openURL(`https://www.youtube.com/results?search_query=${q}`);
            }}
            activeOpacity={0.7}
          >
            <Text style={gachaStyles.videoBtnEmoji}>▶️</Text>
            <Text style={gachaStyles.youtubeBtnText}>YouTubeで検索</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={gachaStyles.tiktokBtn}
            onPress={() => {
              Haptics.selectionAsync();
              const q = encodeURIComponent(`${recipe.name} 作り方`);
              Linking.openURL(`https://www.tiktok.com/search?q=${q}`);
            }}
            activeOpacity={0.7}
          >
            <Text style={gachaStyles.videoBtnEmoji}>🎵</Text>
            <Text style={gachaStyles.tiktokBtnText}>TikTokで検索</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!isPremium && (
        <AdBanner size="banner" adId="fe0b86fd1de3479945b6b0f25cd90d9d" />
      )}

      <View style={gachaStyles.bottomSpacer} />
    </ScrollView>
  );
}

// =============================================================
// Static Recipe Detail (SEO / shareable)
// =============================================================
const RARITY_COLORS: Record<string, { bg: string; text: string }> = {
  N: { bg: '#8B7355', text: '#FFFFFF' },
  R: { bg: '#1E88E5', text: '#FFFFFF' },
  SR: { bg: '#F9A825', text: '#2D1B00' },
  SSR: { bg: '#7B1FA2', text: '#FFFFFF' },
};

function StaticRecipeDetail({ slug }: { slug: string }) {
  const router = useRouter();
  const recipe = STATIC_RECIPES.find((r) => r.slug === slug);

  useRecipeSEO(recipe);

  if (!recipe) {
    return (
      <View style={staticStyles.container}>
        <View style={staticStyles.content}>
          <Text style={staticStyles.errorText}>レシピが見つかりませんでした</Text>
          <TouchableOpacity onPress={() => router.replace('/')}>
            <Text style={staticStyles.linkText}>トップへ戻る</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const colors = RARITY_COLORS[recipe.rarity] || RARITY_COLORS.N;

  return (
    <ScrollView
      style={staticStyles.container}
      contentContainerStyle={staticStyles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={staticStyles.backButton} onPress={() => router.replace('/')}>
        <Text style={staticStyles.backButtonText}>← トップへ</Text>
      </TouchableOpacity>

      <View style={staticStyles.header}>
        <View style={[staticStyles.rarityBadge, { backgroundColor: colors.bg }]}>
          <Text style={[staticStyles.rarityText, { color: colors.text }]}>{recipe.rarity}</Text>
        </View>
        <Text style={staticStyles.recipeName}>{recipe.name}</Text>
        <Text style={staticStyles.recipeDesc}>{recipe.description}</Text>
        <View style={staticStyles.metaRow}>
          <Text style={staticStyles.metaItem}>{recipe.genre}</Text>
          <Text style={staticStyles.metaItem}>{recipe.cookingTimeMinutes}分</Text>
          <Text style={staticStyles.metaItem}>{recipe.calories}kcal</Text>
          <Text style={staticStyles.metaItem}>{recipe.servings}人分</Text>
        </View>
      </View>

      <View style={staticStyles.section}>
        <Text style={staticStyles.sectionTitle}>栄養成分</Text>
        <View style={staticStyles.nutritionGrid}>
          <NutritionItem label="たんぱく質" value={`${recipe.nutrition.protein}g`} />
          <NutritionItem label="脂質" value={`${recipe.nutrition.fat}g`} />
          <NutritionItem label="炭水化物" value={`${recipe.nutrition.carbs}g`} />
          <NutritionItem label="食物繊維" value={`${recipe.nutrition.fiber}g`} />
          <NutritionItem label="食塩相当量" value={`${recipe.nutrition.salt}g`} />
        </View>
      </View>

      <View style={staticStyles.section}>
        <Text style={staticStyles.sectionTitle}>材料（{recipe.servings}人分）</Text>
        <View style={staticStyles.card}>
          {recipe.ingredients.map((ing, i) => (
            <View key={i} style={staticStyles.ingredientRow}>
              <Text style={staticStyles.ingredientName}>{ing.name}</Text>
              <Text style={staticStyles.ingredientAmount}>{ing.amount}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={staticStyles.section}>
        <Text style={staticStyles.sectionTitle}>作り方</Text>
        <View style={staticStyles.card}>
          {recipe.steps.map((step, i) => (
            <View key={i} style={staticStyles.stepRow}>
              <View style={staticStyles.stepNum}>
                <Text style={staticStyles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={staticStyles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={staticStyles.ctaSection}>
        <Text style={staticStyles.ctaTitle}>献立に迷ったら</Text>
        <TouchableOpacity
          style={staticStyles.ctaButton}
          onPress={() => router.replace('/')}
          activeOpacity={0.8}
        >
          <Text style={staticStyles.ctaButtonText}>献立ガチャを回す</Text>
        </TouchableOpacity>
      </View>

      <View style={staticStyles.bottomSpacer} />
    </ScrollView>
  );
}

function NutritionItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={staticStyles.nutritionItem}>
      <Text style={staticStyles.nutritionLabel}>{label}</Text>
      <Text style={staticStyles.nutritionValue}>{value}</Text>
    </View>
  );
}

// =============================================================
// Router: dispatch based on id param
// =============================================================
export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFF8F0', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, color: '#2D1B00' }}>レシピが見つかりません</Text>
      </View>
    );
  }

  if (isMealType(id)) {
    return <GachaRecipeDetail type={id} />;
  }

  return <StaticRecipeDetail slug={id} />;
}

// =============================================================
// Styles: Gacha recipe detail
// =============================================================
const gachaStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#2D1B00',
    marginBottom: 16,
  },
  backBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FF6B35',
    borderRadius: 16,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  favoriteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  favoriteButtonText: {
    fontSize: 24,
    color: '#FF6B35',
  },
  toast: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 18,
    backgroundColor: '#2D1B00',
    borderRadius: 20,
    marginBottom: 12,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  header: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  labelBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#FF6B35',
    borderRadius: 16,
  },
  labelBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  beginnerBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#81C784',
  },
  beginnerBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
  },
  recipeName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2D1B00',
    marginBottom: 8,
  },
  recipeDescription: {
    fontSize: 15,
    color: '#8B7355',
    lineHeight: 22,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  infoBadge: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#FFF0E8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFD4BA',
  },
  infoBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },
  nutritionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E8F5E9',
  },
  nutritionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D1B00',
    marginBottom: 12,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nutritionItem: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#F1F8E9',
    borderRadius: 10,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#33691E',
  },
  nutritionLabel: {
    fontSize: 11,
    color: '#689F38',
    marginTop: 2,
  },
  mealNutritionCard: {
    backgroundColor: '#FFF3E0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  mealNutritionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E65100',
    marginBottom: 10,
  },
  mealNutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mealNutritionItem: {
    alignItems: 'center',
  },
  mealNutritionValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#BF360C',
  },
  mealNutritionLabel: {
    fontSize: 10,
    color: '#E65100',
    marginTop: 2,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#2D1B00',
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 12,
    color: '#B0A090',
    marginBottom: 10,
  },
  ingredientsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EDE4',
  },
  ingredientRowDisliked: {
    backgroundColor: '#FFF0F0',
  },
  ingredientRowSubstituted: {
    backgroundColor: '#E3F2FD',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D4C5B5',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  ingredientName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#2D1B00',
  },
  ingredientAmount: {
    fontSize: 14,
    color: '#8B7355',
  },
  ingredientChecked: {
    textDecorationLine: 'line-through',
    color: '#C4B5A5',
  },
  ingredientSubstituted: {
    color: '#1565C0',
  },
  originalIngredient: {
    fontSize: 12,
    color: '#90A4AE',
  },
  ngBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: '#FF4444',
    borderRadius: 8,
    marginRight: 8,
  },
  ngBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  swapBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginRight: 8,
  },
  swapBtnText: {
    fontSize: 16,
  },
  stepsList: {
    gap: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#2D1B00',
    lineHeight: 24,
  },
  videoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  youtubeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#FF0000',
    gap: 8,
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  youtubeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tiktokBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#010101',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  tiktokBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  videoBtnEmoji: {
    fontSize: 18,
  },
  bottomSpacer: {
    height: 40,
  },
});

// =============================================================
// Styles: Static recipe detail
// =============================================================
const staticStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  backButton: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  rarityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  rarityText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  recipeName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2D1B00',
    textAlign: 'center',
    marginBottom: 8,
  },
  recipeDesc: {
    fontSize: 15,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  metaItem: {
    fontSize: 13,
    color: '#FFFFFF',
    backgroundColor: '#C4B5A5',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    overflow: 'hidden',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2D1B00',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nutritionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 90,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  nutritionLabel: {
    fontSize: 11,
    color: '#8B7355',
    marginBottom: 4,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D1B00',
  },
  ingredientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EDE4',
  },
  ingredientName: {
    fontSize: 15,
    color: '#2D1B00',
    fontWeight: '600',
  },
  ingredientAmount: {
    fontSize: 15,
    color: '#8B7355',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    gap: 12,
  },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#2D1B00',
    lineHeight: 22,
  },
  ctaSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D1B00',
    marginBottom: 12,
  },
  ctaButton: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 24,
    backgroundColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  errorText: {
    fontSize: 18,
    color: '#2D1B00',
    textAlign: 'center',
    marginTop: 100,
    marginBottom: 16,
  },
  linkText: {
    fontSize: 16,
    color: '#FF6B35',
    textAlign: 'center',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 40,
  },
});
