import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFavoritesStore } from '../src/stores/favoritesStore';
import { RARITY_CONFIG, rarityStars } from '../src/constants/rarity';
import type { Rarity } from '../src/types';
import type { FavoriteRecipe } from '../src/stores/favoritesStore';

const RARITY_TOTALS: Record<Rarity, number> = {
  N: 50,
  R: 30,
  SR: 15,
  SSR: 5,
};

const RARITY_ORDER: Rarity[] = ['SSR', 'SR', 'R', 'N'];

const MEAL_TYPE_EMOJI: Record<string, string> = {
  main: '🍖',
  side: '🥗',
  soup: '🍜',
};

export default function CollectionScreen() {
  const router = useRouter();
  const { favorites } = useFavoritesStore();

  const countByRarity = (rarity: Rarity) =>
    favorites.filter((f) => f.recipe.rarity === rarity).length;

  const totalCollected = favorites.length;

  const groupedByRarity = RARITY_ORDER.reduce(
    (acc, rarity) => {
      acc[rarity] = favorites.filter((f) => f.recipe.rarity === rarity);
      return acc;
    },
    {} as Record<Rarity, FavoriteRecipe[]>,
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← 戻る</Text>
      </TouchableOpacity>

      <Text style={styles.pageTitle}>🏆 コレクション図鑑</Text>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 収集状況</Text>
        <View style={styles.card}>
          <Text style={styles.totalText}>
            合計: {totalCollected} / {Object.values(RARITY_TOTALS).reduce((a, b) => a + b, 0)} 種
          </Text>

          {RARITY_ORDER.map((rarity) => {
            const count = countByRarity(rarity);
            const total = RARITY_TOTALS[rarity];
            const config = RARITY_CONFIG[rarity];
            const progress = total > 0 ? count / total : 0;

            return (
              <View key={rarity} style={styles.progressRow}>
                <View style={styles.progressLabel}>
                  <Text style={[styles.progressRarity, { color: config.color }]}>
                    {config.emoji} {rarity}
                  </Text>
                  <Text style={styles.progressCount}>
                    {count} / {total}
                  </Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(progress * 100, 100)}%`,
                        backgroundColor: config.color,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* Favorites list grouped by rarity */}
      {totalCollected === 0 ? (
        <View style={styles.card}>
          <Text style={styles.emptyText}>まだお気に入りがありません</Text>
        </View>
      ) : (
        RARITY_ORDER.map((rarity) => {
          const items = groupedByRarity[rarity];
          if (items.length === 0) return null;
          const config = RARITY_CONFIG[rarity];

          return (
            <View key={rarity} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: config.color }]}>
                {config.emoji} {config.label}（{rarity}）
              </Text>
              <View style={styles.grid}>
                {items.map((fav) => (
                  <View
                    key={fav.recipe.name}
                    style={[
                      styles.recipeCard,
                      {
                        borderColor: config.borderColor,
                        backgroundColor: config.bgColor,
                      },
                    ]}
                  >
                    <View style={styles.recipeCardHeader}>
                      <Text style={[styles.rarityBadgeText, { color: config.color }]}>
                        {rarityStars(rarity)}
                      </Text>
                      <Text style={styles.mealTypeEmoji}>
                        {MEAL_TYPE_EMOJI[fav.mealType] ?? '🍽️'}
                      </Text>
                    </View>
                    <Text style={styles.recipeName} numberOfLines={2}>
                      {fav.recipe.name}
                    </Text>
                    <Text style={styles.savedDate}>
                      {new Date(fav.savedAt).toLocaleDateString('ja-JP')}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })
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
  section: {
    marginBottom: 28,
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
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2D1B00',
    marginBottom: 16,
    textAlign: 'center',
  },
  progressRow: {
    marginBottom: 12,
  },
  progressLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  progressRarity: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressCount: {
    fontSize: 13,
    color: '#8B7355',
    fontWeight: '600',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#F5EDE4',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  emptyText: {
    fontSize: 14,
    color: '#B0A090',
    textAlign: 'center',
    lineHeight: 22,
    paddingVertical: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  recipeCard: {
    width: '47%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  recipeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  rarityBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  mealTypeEmoji: {
    fontSize: 16,
  },
  recipeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D1B00',
    marginBottom: 6,
    lineHeight: 20,
  },
  savedDate: {
    fontSize: 11,
    color: '#B0A090',
  },
  bottomSpacer: {
    height: 40,
  },
});
