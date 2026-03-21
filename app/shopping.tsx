import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useHistoryStore } from '../src/stores/historyStore';
import type { Recipe } from '../src/types';

interface IngredientItem {
  name: string;
  amount: string;
  section: string;
  sectionEmoji: string;
}

function buildIngredientList(
  main: Recipe,
  side: Recipe,
  soup: Recipe,
): IngredientItem[] {
  const items: IngredientItem[] = [];
  for (const ing of main.ingredients) {
    items.push({ ...ing, section: '主菜', sectionEmoji: '🍖' });
  }
  for (const ing of side.ingredients) {
    items.push({ ...ing, section: '副菜', sectionEmoji: '🥗' });
  }
  for (const ing of soup.ingredients) {
    items.push({ ...ing, section: '汁物', sectionEmoji: '🍜' });
  }
  return items;
}

function buildShareText(
  items: IngredientItem[],
  mainName: string,
  sideName: string,
  soupName: string,
): string {
  let text = '🛒 買い物リスト\n\n';
  text += `🍖 主菜: ${mainName}\n`;
  const mainItems = items.filter((i) => i.section === '主菜');
  for (const item of mainItems) {
    text += `  ・${item.name} ${item.amount}\n`;
  }
  text += `\n🥗 副菜: ${sideName}\n`;
  const sideItems = items.filter((i) => i.section === '副菜');
  for (const item of sideItems) {
    text += `  ・${item.name} ${item.amount}\n`;
  }
  text += `\n🍜 汁物: ${soupName}\n`;
  const soupItems = items.filter((i) => i.section === '汁物');
  for (const item of soupItems) {
    text += `  ・${item.name} ${item.amount}\n`;
  }
  return text;
}

export default function ShoppingScreen() {
  const router = useRouter();
  const decidedMeals = useHistoryStore((s) => s.decidedMeals);
  const latest = decidedMeals.length > 0 ? decidedMeals[0] : null;

  const ingredients = useMemo(() => {
    if (!latest) return [];
    return buildIngredientList(
      latest.mealPlan.main,
      latest.mealPlan.side,
      latest.mealPlan.soup,
    );
  }, [latest]);

  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggleCheck = (key: string) => {
    Haptics.selectionAsync();
    setChecked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const remainingCount = ingredients.filter(
    (_, i) => !checked[`${i}`],
  ).length;

  const shareText = useMemo(() => {
    if (!latest) return '';
    return buildShareText(
      ingredients,
      latest.mealPlan.main.name,
      latest.mealPlan.side.name,
      latest.mealPlan.soup.name,
    );
  }, [latest, ingredients]);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(shareText);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('コピーしました', '買い物リストをクリップボードにコピーしました。');
  };

  const handleLineShare = () => {
    const url = `https://line.me/R/share?text=${encodeURIComponent(shareText)}`;
    Linking.openURL(url);
  };

  if (!latest) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← 戻る</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.pageTitle}>🛒 買い物リスト</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyText}>
            まだ献立が決定されていません。{'\n'}
            ガチャで献立を決めてみましょう！
          </Text>
          <TouchableOpacity
            style={styles.goHomeButton}
            onPress={() => router.replace('/')}
            activeOpacity={0.8}
          >
            <Text style={styles.goHomeButtonText}>🎰 ガチャを回す</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { main, side, soup } = latest.mealPlan;
  const sections = [
    { key: '主菜', emoji: '🍖', recipe: main },
    { key: '副菜', emoji: '🥗', recipe: side },
    { key: '汁物', emoji: '🍜', recipe: soup },
  ] as const;

  let globalIndex = 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← 戻る</Text>
      </TouchableOpacity>

      <Text style={styles.pageTitle}>🛒 買い物リスト</Text>

      <View style={styles.remainingBadge}>
        <Text style={styles.remainingText}>
          残り {remainingCount} 品
        </Text>
      </View>

      {sections.map((section) => {
        const startIndex = globalIndex;
        const sectionItems = section.recipe.ingredients.map((ing, i) => {
          const idx = startIndex + i;
          globalIndex++;
          return { ...ing, idx };
        });

        return (
          <View key={section.key} style={styles.section}>
            <Text style={styles.sectionTitle}>
              {section.emoji} {section.key}：{section.recipe.name}
            </Text>
            <View style={styles.card}>
              {sectionItems.map((item, i) => (
                <TouchableOpacity
                  key={item.idx}
                  style={[
                    styles.ingredientRow,
                    i < sectionItems.length - 1 && styles.ingredientRowBorder,
                  ]}
                  onPress={() => toggleCheck(`${item.idx}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.checkboxArea}>
                    <View
                      style={[
                        styles.checkbox,
                        checked[`${item.idx}`] && styles.checkboxChecked,
                      ]}
                    >
                      {checked[`${item.idx}`] && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.ingredientName,
                      checked[`${item.idx}`] && styles.ingredientChecked,
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.ingredientAmount,
                      checked[`${item.idx}`] && styles.ingredientChecked,
                    ]}
                  >
                    {item.amount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );
      })}

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.copyButton}
          onPress={handleCopy}
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
  headerRow: {
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
    marginBottom: 16,
  },
  remainingBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#FFF0E8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD4BA',
    marginBottom: 20,
  },
  remainingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B35',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D1B00',
    marginBottom: 10,
  },
  card: {
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
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  ingredientRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F5EDE4',
  },
  checkboxArea: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D4C5B5',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  checkmark: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
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
    marginLeft: 8,
  },
  ingredientChecked: {
    textDecorationLine: 'line-through',
    color: '#C4B5A5',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  copyButton: {
    flex: 1,
    paddingVertical: 16,
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
    paddingVertical: 16,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#B0A090',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  goHomeButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
  },
  goHomeButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: 40,
  },
});
