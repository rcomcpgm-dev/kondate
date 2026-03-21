import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useSubscriptionStore } from '../src/stores/subscriptionStore';
import { usePreferencesStore } from '../src/stores/preferencesStore';
import { useHistoryStore } from '../src/stores/historyStore';
import { generateWeeklyMealPlan } from '../src/lib/api';
import { generateWeeklyWithAI } from '../src/lib/ai';
import type { WeeklyMealPlan, MealPlan, Recipe } from '../src/types';

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];
const DAY_COLORS: Record<number, string> = {
  0: '#FF4444', // Sunday red
  6: '#4488FF', // Saturday blue
};

function SpinnerAnimation() {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 1200, easing: Easing.linear }),
      -1,
      false,
    );
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 600 }),
        withTiming(0.8, { duration: 600 }),
      ),
      -1,
      true,
    );
  }, [rotation, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <View style={styles.spinnerContainer}>
      <Animated.View style={animStyle}>
        <Text style={styles.spinnerEmoji}>📅</Text>
      </Animated.View>
      <Text style={styles.spinnerText}>週間献立を生成中...</Text>
      <View style={styles.dotsRow}>
        {[0, 1, 2].map((i) => (
          <DotAnimation key={i} delay={i * 200} />
        ))}
      </View>
    </View>
  );
}

function DotAnimation({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 }),
        ),
        -1,
        true,
      ),
    );
  }, [opacity, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.dot, style]} />;
}

function DayCard({
  date,
  plan,
  index,
  expanded,
  onToggle,
}: {
  date: string;
  plan: MealPlan;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const d = new Date(date + 'T00:00:00');
  const dayOfWeek = d.getDay();
  const dayLabel = DAY_LABELS[dayOfWeek];
  const dayColor = DAY_COLORS[dayOfWeek] ?? '#2D1B00';
  const month = d.getMonth() + 1;
  const day = d.getDate();

  const translateY = useSharedValue(30);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      index * 80,
      withSpring(0, { damping: 12, stiffness: 100 }),
    );
    cardOpacity.value = withDelay(
      index * 80,
      withTiming(1, { duration: 300 }),
    );
  }, [translateY, cardOpacity, index]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: cardOpacity.value,
  }));

  const totalCalories =
    (plan.main.calories ?? 0) + (plan.side.calories ?? 0) + (plan.soup.calories ?? 0);

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[styles.dayCard, expanded && styles.dayCardExpanded]}
        onPress={() => {
          Haptics.selectionAsync();
          onToggle();
        }}
        activeOpacity={0.7}
      >
        <View style={styles.dayCardHeader}>
          <View style={styles.dayDateContainer}>
            <Text style={[styles.dayLabel, { color: dayColor }]}>{dayLabel}</Text>
            <Text style={styles.dayDate}>{month}/{day}</Text>
          </View>
          <View style={styles.dayMainInfo}>
            <Text style={styles.dayMainName} numberOfLines={1}>
              {plan.main.name}
            </Text>
            <Text style={styles.dayCalories}>🔥 {totalCalories}kcal</Text>
          </View>
          <Text style={styles.expandArrow}>{expanded ? '▲' : '▼'}</Text>
        </View>

        {expanded && (
          <View style={styles.dayCardDetail}>
            <RecipeRow emoji="🍖" label="主菜" recipe={plan.main} />
            <RecipeRow emoji="🥗" label="副菜" recipe={plan.side} />
            <RecipeRow emoji="🍜" label="汁物" recipe={plan.soup} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function RecipeRow({
  emoji,
  label,
  recipe,
}: {
  emoji: string;
  label: string;
  recipe: Recipe;
}) {
  return (
    <View style={styles.recipeRow}>
      <Text style={styles.recipeRowEmoji}>{emoji}</Text>
      <View style={styles.recipeRowInfo}>
        <Text style={styles.recipeRowLabel}>{label}</Text>
        <Text style={styles.recipeRowName}>{recipe.name}</Text>
        <Text style={styles.recipeRowDesc}>{recipe.description}</Text>
      </View>
      <View style={styles.recipeRowBadge}>
        <Text style={styles.recipeRowCalories}>
          {recipe.calories ?? 0}kcal
        </Text>
      </View>
    </View>
  );
}

function aggregateIngredients(
  weeklyPlan: WeeklyMealPlan,
): { name: string; amounts: string[] }[] {
  const map = new Map<string, string[]>();

  for (const { plan } of weeklyPlan.days) {
    for (const recipe of [plan.main, plan.side, plan.soup]) {
      for (const ing of recipe.ingredients) {
        const existing = map.get(ing.name);
        if (existing) {
          if (!existing.includes(ing.amount)) {
            existing.push(ing.amount);
          }
        } else {
          map.set(ing.name, [ing.amount]);
        }
      }
    }
  }

  return Array.from(map.entries()).map(([name, amounts]) => ({ name, amounts }));
}

export default function WeeklyScreen() {
  const router = useRouter();
  const isPremium = useSubscriptionStore((s) => s.isPremium());
  const purchase = useSubscriptionStore((s) => s.purchase);
  const dislikedNames = usePreferencesStore((s) => s.getDislikedNames());
  const recentMeals = useHistoryStore((s) => s.getRecentDecisions(14));

  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyMealPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [showShoppingList, setShowShoppingList] = useState(false);

  const startGeneration = useCallback(async () => {
    setIsGenerating(true);
    setWeeklyPlan(null);
    setExpandedDay(null);
    setShowShoppingList(false);

    try {
      let plan: WeeklyMealPlan;
      if (isPremium) {
        try {
          plan = await generateWeeklyWithAI(dislikedNames, recentMeals);
        } catch {
          // Fallback to mock if AI fails
          plan = await generateWeeklyMealPlan(dislikedNames);
        }
      } else {
        plan = await generateWeeklyMealPlan(dislikedNames);
      }
      setWeeklyPlan(plan);
    } catch {
      Alert.alert('エラー', '週間献立の生成に失敗しました。もう一度お試しください。');
    } finally {
      setIsGenerating(false);
    }
  }, [isPremium, dislikedNames, recentMeals]);

  useEffect(() => {
    if (isPremium) {
      startGeneration();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalWeeklyCalories = useMemo(() => {
    if (!weeklyPlan) return 0;
    return weeklyPlan.days.reduce((sum, { plan }) => {
      return sum + (plan.main.calories ?? 0) + (plan.side.calories ?? 0) + (plan.soup.calories ?? 0);
    }, 0);
  }, [weeklyPlan]);

  const shoppingItems = useMemo(() => {
    if (!weeklyPlan) return [];
    return aggregateIngredients(weeklyPlan);
  }, [weeklyPlan]);

  const handleCopyShoppingList = async () => {
    let text = '🛒 週間買い物リスト\n\n';
    for (const item of shoppingItems) {
      text += `・${item.name}（${item.amounts.join('、')}）\n`;
    }
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('コピーしました', '買い物リストをクリップボードにコピーしました。');
  };

  const handleLineShare = () => {
    let text = '🛒 週間買い物リスト\n\n';
    for (const item of shoppingItems) {
      text += `・${item.name}（${item.amounts.join('、')}）\n`;
    }
    const url = `https://line.me/R/share?text=${encodeURIComponent(text)}`;
    Linking.openURL(url);
  };

  // Non-premium: show upsell
  if (!isPremium) {
    return (
      <View style={styles.container}>
        <View style={styles.contentPadding}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← 戻る</Text>
          </TouchableOpacity>

          <View style={styles.lockContainer}>
            <Text style={styles.lockEmoji}>🔒</Text>
            <View style={styles.premiumTag}>
              <Text style={styles.premiumTagText}>Premium限定</Text>
            </View>
            <Text style={styles.lockTitle}>📅 週間献立モード</Text>
            <Text style={styles.lockDesc}>
              1週間分の献立をまとめて生成！{'\n'}
              買い物リストも自動作成されます。
            </Text>
            <View style={styles.lockFeatures}>
              <Text style={styles.lockFeature}>✅ 7日分の献立を一括生成</Text>
              <Text style={styles.lockFeature}>✅ AI重複回避で飽きない献立</Text>
              <Text style={styles.lockFeature}>✅ まとめ買い物リスト</Text>
              <Text style={styles.lockFeature}>✅ 週間カロリー管理</Text>
            </View>
            <TouchableOpacity
              style={styles.purchaseButton}
              onPress={async () => {
                await purchase();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                startGeneration();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.purchaseButtonText}>IQOS代をおごる 🚬</Text>
              <Text style={styles.purchasePrice}>¥480 / 月</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backLinkButton} onPress={() => router.back()}>
              <Text style={styles.backLinkText}>ホームに戻る</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Generating state
  if (isGenerating) {
    return (
      <View style={styles.generatingContainer}>
        <SpinnerAnimation />
      </View>
    );
  }

  // No plan yet (edge case)
  if (!weeklyPlan) {
    return (
      <View style={styles.container}>
        <View style={styles.contentPadding}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← 戻る</Text>
          </TouchableOpacity>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyText}>週間献立を生成しましょう</Text>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={startGeneration}
              activeOpacity={0.8}
            >
              <Text style={styles.generateButtonText}>📅 生成開始</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentPadding}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← 戻る</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>📅</Text>
        <Text style={styles.headerTitle}>週間献立</Text>
        <Text style={styles.headerSubtitle}>1週間分の献立プラン</Text>
      </View>

      {/* Weekly calories summary */}
      <View style={styles.caloriesSummary}>
        <Text style={styles.caloriesSummaryLabel}>週間合計カロリー</Text>
        <Text style={styles.caloriesSummaryValue}>
          🔥 {totalWeeklyCalories.toLocaleString()} kcal
        </Text>
        <Text style={styles.caloriesSummaryAvg}>
          1日平均 {Math.round(totalWeeklyCalories / 7)} kcal
        </Text>
      </View>

      {/* Day cards */}
      <View style={styles.dayCardsContainer}>
        {weeklyPlan.days.map((day, i) => (
          <DayCard
            key={day.date}
            date={day.date}
            plan={day.plan}
            index={i}
            expanded={expandedDay === i}
            onToggle={() => setExpandedDay(expandedDay === i ? null : i)}
          />
        ))}
      </View>

      {/* Shopping list button */}
      {!showShoppingList ? (
        <TouchableOpacity
          style={styles.shoppingButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowShoppingList(true);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.shoppingButtonText}>🛒 まとめて買い物リスト</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.shoppingListSection}>
          <Text style={styles.shoppingListTitle}>🛒 まとめて買い物リスト</Text>
          <Text style={styles.shoppingListHint}>
            {shoppingItems.length}種類の食材（重複統合済み）
          </Text>
          <View style={styles.shoppingListCard}>
            {shoppingItems.map((item, i) => (
              <View
                key={item.name}
                style={[
                  styles.shoppingItem,
                  i < shoppingItems.length - 1 && styles.shoppingItemBorder,
                ]}
              >
                <Text style={styles.shoppingItemName}>{item.name}</Text>
                <Text style={styles.shoppingItemAmount}>
                  {item.amounts.join('、')}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.shoppingActions}>
            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopyShoppingList}
              activeOpacity={0.8}
            >
              <Text style={styles.copyButtonText}>📋 コピー</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.lineButton}
              onPress={handleLineShare}
              activeOpacity={0.8}
            >
              <Text style={styles.lineButtonText}>💬 LINEで送る</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Regenerate */}
      <TouchableOpacity
        style={styles.regenerateButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          startGeneration();
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.regenerateButtonText}>🔄 もう一度生成する</Text>
      </TouchableOpacity>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  contentPadding: {
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  generatingContainer: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Spinner
  spinnerContainer: {
    alignItems: 'center',
  },
  spinnerEmoji: {
    fontSize: 72,
  },
  spinnerText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B35',
  },
  dotsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B35',
  },
  // Back button
  backButton: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2D1B00',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8B7355',
    marginTop: 4,
  },
  // Calories summary
  caloriesSummary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0E6D8',
  },
  caloriesSummaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B7355',
    marginBottom: 4,
  },
  caloriesSummaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FF6B35',
  },
  caloriesSummaryAvg: {
    fontSize: 13,
    color: '#B0A090',
    marginTop: 4,
  },
  // Day cards
  dayCardsContainer: {
    gap: 10,
    marginBottom: 24,
  },
  dayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0E6D8',
  },
  dayCardExpanded: {
    borderColor: '#FF6B35',
    borderWidth: 2,
  },
  dayCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayDateContainer: {
    alignItems: 'center',
    width: 48,
    marginRight: 12,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  dayDate: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 2,
  },
  dayMainInfo: {
    flex: 1,
  },
  dayMainName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D1B00',
  },
  dayCalories: {
    fontSize: 12,
    color: '#FF8C5A',
    marginTop: 2,
  },
  expandArrow: {
    fontSize: 12,
    color: '#C4B5A5',
    marginLeft: 8,
  },
  // Day card detail
  dayCardDetail: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F5EDE4',
    gap: 12,
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeRowEmoji: {
    fontSize: 24,
    marginRight: 10,
  },
  recipeRowInfo: {
    flex: 1,
  },
  recipeRowLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF6B35',
  },
  recipeRowName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D1B00',
  },
  recipeRowDesc: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 1,
  },
  recipeRowBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#FFF0E8',
    borderRadius: 10,
    marginLeft: 8,
  },
  recipeRowCalories: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF8C5A',
  },
  // Shopping button
  shoppingButton: {
    paddingVertical: 18,
    borderRadius: 24,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 12,
  },
  shoppingButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  // Shopping list
  shoppingListSection: {
    marginBottom: 12,
  },
  shoppingListTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D1B00',
    marginBottom: 4,
  },
  shoppingListHint: {
    fontSize: 13,
    color: '#8B7355',
    marginBottom: 12,
  },
  shoppingListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 14,
  },
  shoppingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  shoppingItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5EDE4',
  },
  shoppingItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D1B00',
    flex: 1,
  },
  shoppingItemAmount: {
    fontSize: 13,
    color: '#8B7355',
    marginLeft: 8,
    flexShrink: 1,
    textAlign: 'right',
  },
  shoppingActions: {
    flexDirection: 'row',
    gap: 12,
  },
  copyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  lineButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: '#06C755',
    alignItems: 'center',
    shadowColor: '#06C755',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  lineButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  // Regenerate
  regenerateButton: {
    paddingVertical: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B35',
    marginTop: 4,
  },
  regenerateButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FF6B35',
  },
  // Lock screen
  lockContainer: {
    alignItems: 'center',
    paddingTop: 40,
  },
  lockEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  premiumTag: {
    paddingVertical: 4,
    paddingHorizontal: 14,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD54F',
    marginBottom: 16,
  },
  premiumTagText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F9A825',
  },
  lockTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2D1B00',
    marginBottom: 8,
  },
  lockDesc: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  lockFeatures: {
    alignSelf: 'stretch',
    marginBottom: 24,
    gap: 6,
  },
  lockFeature: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D1B00',
    lineHeight: 24,
  },
  purchaseButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 12,
  },
  purchaseButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  purchasePrice: {
    fontSize: 13,
    color: '#FFD4BA',
    marginTop: 2,
  },
  backLinkButton: {
    paddingVertical: 10,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0A090',
  },
  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#8B7355',
    marginBottom: 24,
  },
  generateButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: 40,
  },
});
