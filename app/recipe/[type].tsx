import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMealStore } from '../../src/stores/mealStore';
import { useSubscriptionStore } from '../../src/stores/subscriptionStore';
import { usePreferencesStore } from '../../src/stores/preferencesStore';
import { useFavoritesStore } from '../../src/stores/favoritesStore';
import { AdBanner } from '../../src/components/AdBanner';
import { RARITY_CONFIG, rarityStars } from '../../src/constants/rarity';
import { getSubstitutions } from '../../src/constants/substitutions';
import type { Recipe } from '../../src/types';

export default function RecipeDetailScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const router = useRouter();
  const result = useMealStore((s) => s.result);
  const isPremium = useSubscriptionStore((s) => s.isPremium());
  const { isDisliked, addDisliked, removeDisliked } = usePreferencesStore();
  const { addFavorite, removeFavorite, isFavorite } = useFavoritesStore();
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [substitutions, setSubstitutions] = useState<Record<number, string>>({});
  const [toastVisible, setToastVisible] = useState(false);

  if (!result || !type) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>レシピが見つかりません</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  let recipe: Recipe;
  let label: string;
  let emoji: string;

  switch (type) {
    case 'main':
      recipe = result.main;
      label = '主菜';
      emoji = '🍖';
      break;
    case 'side':
      recipe = result.side;
      label = '副菜';
      emoji = '🥗';
      break;
    case 'soup':
      recipe = result.soup;
      label = '汁物';
      emoji = '🍜';
      break;
    default:
      recipe = result.main;
      label = '主菜';
      emoji = '🍖';
  }

  const toggleIngredient = (index: number) => {
    Haptics.selectionAsync();
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
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
      // Toggle: if already substituted, revert
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
      // Multiple options
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

  const mealType = type as 'main' | 'side' | 'soup';
  const favorited = isFavorite(recipe.name);

  const handleToggleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (favorited) {
      removeFavorite(recipe.name);
    } else {
      addFavorite(recipe, mealType);
      setToastVisible(true);
      setTimeout(() => setToastVisible(false), 1800);
    }
  };

  const totalNutrition = recipe.nutrition;

  // Calculate total meal nutrition if all three recipes have nutrition data
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
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← 戻る</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={handleToggleFavorite}
          activeOpacity={0.7}
        >
          <Text style={styles.favoriteButtonText}>{favorited ? '♥' : '♡'}</Text>
        </TouchableOpacity>
      </View>

      {toastVisible && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>お気に入りに追加しました</Text>
        </View>
      )}

      <View style={styles.header}>
        <View style={styles.labelRow}>
          <View style={styles.labelBadge}>
            <Text style={styles.labelBadgeText}>{emoji} {label}</Text>
          </View>
          <View style={[
            styles.rarityBadge,
            {
              backgroundColor: RARITY_CONFIG[recipe.rarity].bgColor,
              borderColor: RARITY_CONFIG[recipe.rarity].borderColor,
            },
          ]}>
            <Text style={[styles.rarityBadgeText, { color: RARITY_CONFIG[recipe.rarity].color }]}>
              {RARITY_CONFIG[recipe.rarity].emoji} {recipe.rarity} {rarityStars(recipe.rarity)}
            </Text>
          </View>
          {recipe.difficulty === 'beginner' && (
            <View style={styles.beginnerBadge}>
              <Text style={styles.beginnerBadgeText}>🔰 初心者OK</Text>
            </View>
          )}
        </View>
        <Text style={styles.recipeName}>{recipe.name}</Text>
        <Text style={styles.recipeDescription}>{recipe.description}</Text>
      </View>

      {/* Badges */}
      <View style={styles.badgeRow}>
        <View style={styles.infoBadge}>
          <Text style={styles.infoBadgeText}>⏱️ {recipe.cookingTimeMinutes}分</Text>
        </View>
        {recipe.calories != null && (
          <View style={styles.infoBadge}>
            <Text style={styles.infoBadgeText}>🔥 {recipe.calories}kcal</Text>
          </View>
        )}
      </View>

      {/* Nutrition Info (per dish) */}
      {totalNutrition && (
        <View style={styles.nutritionCard}>
          <Text style={styles.nutritionTitle}>📊 栄養成分（1人分）</Text>
          <View style={styles.nutritionGrid}>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{totalNutrition.calories}</Text>
              <Text style={styles.nutritionLabel}>kcal</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{totalNutrition.protein}g</Text>
              <Text style={styles.nutritionLabel}>たんぱく質</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{totalNutrition.fat}g</Text>
              <Text style={styles.nutritionLabel}>脂質</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{totalNutrition.carbs}g</Text>
              <Text style={styles.nutritionLabel}>炭水化物</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{totalNutrition.fiber}g</Text>
              <Text style={styles.nutritionLabel}>食物繊維</Text>
            </View>
            <View style={styles.nutritionItem}>
              <Text style={styles.nutritionValue}>{totalNutrition.salt}g</Text>
              <Text style={styles.nutritionLabel}>塩分</Text>
            </View>
          </View>
        </View>
      )}

      {/* Total Meal Nutrition */}
      {mealNutrition && (
        <View style={styles.mealNutritionCard}>
          <Text style={styles.mealNutritionTitle}>📋 献立合計（3品）</Text>
          <View style={styles.mealNutritionRow}>
            <View style={styles.mealNutritionItem}>
              <Text style={styles.mealNutritionValue}>{mealNutrition.calories}</Text>
              <Text style={styles.mealNutritionLabel}>kcal</Text>
            </View>
            <View style={styles.mealNutritionItem}>
              <Text style={styles.mealNutritionValue}>P {mealNutrition.protein}g</Text>
              <Text style={styles.mealNutritionLabel}>たんぱく質</Text>
            </View>
            <View style={styles.mealNutritionItem}>
              <Text style={styles.mealNutritionValue}>F {mealNutrition.fat}g</Text>
              <Text style={styles.mealNutritionLabel}>脂質</Text>
            </View>
            <View style={styles.mealNutritionItem}>
              <Text style={styles.mealNutritionValue}>C {mealNutrition.carbs}g</Text>
              <Text style={styles.mealNutritionLabel}>炭水化物</Text>
            </View>
          </View>
        </View>
      )}

      {/* Ingredients */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🛒 材料</Text>
        <Text style={styles.sectionHint}>長押しでNG食材に登録 ・ タップで🔄置き換え</Text>
        <View style={styles.ingredientsList}>
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
                  styles.ingredientRow,
                  disliked && styles.ingredientRowDisliked,
                  isSubstituted && styles.ingredientRowSubstituted,
                ]}
                onPress={() => toggleIngredient(i)}
                onLongPress={() => handleToggleDislike(ing.name)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    isChecked && styles.checkboxChecked,
                  ]}
                >
                  {isChecked && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text
                  style={[
                    styles.ingredientName,
                    isChecked && styles.ingredientChecked,
                    isSubstituted && styles.ingredientSubstituted,
                  ]}
                >
                  {isSubstituted ? `${displayName}` : ing.name}
                  {isSubstituted && (
                    <Text style={styles.originalIngredient}>{` (元: ${ing.name})`}</Text>
                  )}
                </Text>
                {disliked && (
                  <TouchableOpacity
                    style={styles.ngBadge}
                    onPress={() => {
                      Haptics.selectionAsync();
                      removeDisliked(ing.name);
                    }}
                  >
                    <Text style={styles.ngBadgeText}>NG</Text>
                  </TouchableOpacity>
                )}
                {hasSubs && !isChecked && (
                  <TouchableOpacity
                    style={styles.swapBtn}
                    onPress={() => handleSubstitute(i, ing.name)}
                  >
                    <Text style={styles.swapBtnText}>🔄</Text>
                  </TouchableOpacity>
                )}
                <Text
                  style={[
                    styles.ingredientAmount,
                    isChecked && styles.ingredientChecked,
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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 作り方</Text>
        <View style={styles.stepsList}>
          {recipe.steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Video Search */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎬 動画で見る</Text>
        <View style={styles.videoRow}>
          <TouchableOpacity
            style={styles.youtubeBtn}
            onPress={() => {
              Haptics.selectionAsync();
              const q = encodeURIComponent(`${recipe.name} 作り方`);
              Linking.openURL(`https://www.youtube.com/results?search_query=${q}`);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.videoBtnEmoji}>▶️</Text>
            <Text style={styles.youtubeBtnText}>YouTubeで検索</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tiktokBtn}
            onPress={() => {
              Haptics.selectionAsync();
              const q = encodeURIComponent(`${recipe.name} 作り方`);
              Linking.openURL(`https://www.tiktok.com/search?q=${q}`);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.videoBtnEmoji}>🎵</Text>
            <Text style={styles.tiktokBtnText}>TikTokで検索</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!isPremium && (
        <AdBanner size="banner" adId="fe0b86fd1de3479945b6b0f25cd90d9d" />
      )}

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  rarityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  rarityBadgeText: {
    fontSize: 12,
    fontWeight: '700',
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
  // Nutrition
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
  // Meal total nutrition
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
  // Video search
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
