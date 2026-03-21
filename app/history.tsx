import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useHistoryStore } from '../src/stores/historyStore';
import { useSubscriptionStore } from '../src/stores/subscriptionStore';
import type { DecidedMeal } from '../src/types';

/** Group meals by date string and sum calories per day */
function buildCalorieChart(meals: DecidedMeal[], days: number) {
  const now = new Date();
  const result: { label: string; calories: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
    const label = `${d.getMonth() + 1}/${d.getDate()}`;

    const dayMeals = meals.filter(
      (m) => m.decidedAt.slice(0, 10) === key,
    );
    const calories = dayMeals.reduce((sum, m) => {
      return (
        sum +
        (m.mealPlan.main.calories ?? 0) +
        (m.mealPlan.side.calories ?? 0) +
        (m.mealPlan.soup.calories ?? 0)
      );
    }, 0);

    result.push({ label, calories });
  }
  return result;
}

function CalorieChart({ meals }: { meals: DecidedMeal[] }) {
  const [range, setRange] = useState<7 | 14 | 30>(7);
  const data = buildCalorieChart(meals, range);
  const maxCal = Math.max(...data.map((d) => d.calories), 1);
  const avgCal = data.reduce((s, d) => s + d.calories, 0) / data.filter((d) => d.calories > 0).length || 0;

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>🔥 カロリー推移</Text>

      {/* Range tabs */}
      <View style={styles.chartTabs}>
        {([7, 14, 30] as const).map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.chartTab, range === r && styles.chartTabActive]}
            onPress={() => setRange(r)}
          >
            <Text style={[styles.chartTabText, range === r && styles.chartTabTextActive]}>
              {r}日
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Average */}
      {avgCal > 0 && (
        <Text style={styles.chartAvg}>
          平均: {Math.round(avgCal)} kcal/日
        </Text>
      )}

      {/* Bar chart */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.chartBars}>
          {data.map((d, i) => {
            const barHeight = d.calories > 0 ? (d.calories / maxCal) * 120 : 2;
            const isOver = d.calories > 2000;
            const isGood = d.calories > 0 && d.calories <= 1800;
            return (
              <View key={i} style={styles.chartBarCol}>
                {d.calories > 0 && (
                  <Text style={styles.chartBarValue}>{d.calories}</Text>
                )}
                <View
                  style={[
                    styles.chartBar,
                    {
                      height: barHeight,
                      backgroundColor: isOver
                        ? '#EF5350'
                        : isGood
                        ? '#66BB6A'
                        : d.calories > 0
                        ? '#FFA726'
                        : '#E0D5C5',
                    },
                  ]}
                />
                <Text style={[styles.chartBarLabel, range > 14 && { fontSize: 8 }]}>
                  {d.label}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Legend */}
      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#66BB6A' }]} />
          <Text style={styles.legendText}>〜1800kcal</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FFA726' }]} />
          <Text style={styles.legendText}>1800〜2000</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EF5350' }]} />
          <Text style={styles.legendText}>2000+</Text>
        </View>
      </View>
    </View>
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const { decidedMeals } = useHistoryStore();
  const isPremium = useSubscriptionStore((s) => s.isPremium());

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← 戻る</Text>
      </TouchableOpacity>

      <Text style={styles.pageTitle}>📋 献立履歴</Text>

      {/* Calorie chart - premium only */}
      {isPremium && decidedMeals.length > 0 && (
        <CalorieChart meals={decidedMeals} />
      )}
      {!isPremium && decidedMeals.length > 0 && (
        <View style={styles.chartLocked}>
          <Text style={styles.chartLockedEmoji}>📊</Text>
          <Text style={styles.chartLockedText}>
            IQOS代おごるとカロリーグラフが見れます 🚬
          </Text>
        </View>
      )}

      {decidedMeals.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📝</Text>
          <Text style={styles.emptyText}>まだ献立が決定されていません</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {decidedMeals.map((meal, i) => {
            const date = new Date(meal.decidedAt);
            const dateStr = date.toLocaleDateString('ja-JP', {
              month: 'long',
              day: 'numeric',
            });
            const timeStr = date.toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit',
            });
            const totalCalories =
              (meal.mealPlan.main.calories ?? 0) +
              (meal.mealPlan.side.calories ?? 0) +
              (meal.mealPlan.soup.calories ?? 0);

            return (
              <View key={i} style={styles.historyCard}>
                <View style={styles.dateRow}>
                  <Text style={styles.dateText}>{dateStr}</Text>
                  <Text style={styles.timeText}>{timeStr}</Text>
                </View>
                <View style={styles.mealRow}>
                  <Text style={styles.mealEmoji}>🍖</Text>
                  <Text style={styles.mealName}>{meal.mealPlan.main.name}</Text>
                </View>
                <View style={styles.mealRow}>
                  <Text style={styles.mealEmoji}>🥗</Text>
                  <Text style={styles.mealName}>{meal.mealPlan.side.name}</Text>
                </View>
                <View style={styles.mealRow}>
                  <Text style={styles.mealEmoji}>🍜</Text>
                  <Text style={styles.mealName}>{meal.mealPlan.soup.name}</Text>
                </View>
                {totalCalories > 0 && (
                  <View style={styles.calorieBadge}>
                    <Text style={styles.calorieText}>
                      🔥 合計 {totalCalories}kcal
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
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
  backButton: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2D1B00',
    marginBottom: 28,
  },
  // Calorie chart
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0E6D8',
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D1B00',
    marginBottom: 12,
  },
  chartTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  chartTab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: '#F5F0E8',
  },
  chartTabActive: {
    backgroundColor: '#FF6B35',
  },
  chartTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B7355',
  },
  chartTabTextActive: {
    color: '#FFFFFF',
  },
  chartAvg: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B7355',
    marginBottom: 12,
    textAlign: 'center',
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    minHeight: 160,
    paddingTop: 20,
  },
  chartBarCol: {
    alignItems: 'center',
    width: 36,
  },
  chartBarValue: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8B7355',
    marginBottom: 4,
  },
  chartBar: {
    width: 20,
    borderRadius: 6,
    minHeight: 2,
  },
  chartBarLabel: {
    fontSize: 10,
    color: '#B0A090',
    marginTop: 6,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 14,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    color: '#8B7355',
  },
  // Chart locked
  chartLocked: {
    backgroundColor: '#F5F0E8',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0D8CC',
    borderStyle: 'dashed',
  },
  chartLockedEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  chartLockedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B0A090',
    textAlign: 'center',
  },
  // Empty
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#B0A090',
  },
  // List
  list: {
    gap: 14,
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0E6D8',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF6B35',
  },
  timeText: {
    fontSize: 13,
    color: '#B0A090',
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  mealEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  mealName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D1B00',
  },
  calorieBadge: {
    marginTop: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#FFF0E8',
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  calorieText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF8C5A',
  },
  bottomSpacer: {
    height: 40,
  },
});
