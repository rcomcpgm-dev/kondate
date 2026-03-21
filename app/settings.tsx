import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { usePreferencesStore } from '../src/stores/preferencesStore';
import { useSubscriptionStore } from '../src/stores/subscriptionStore';
import { useHistoryStore } from '../src/stores/historyStore';

export default function SettingsScreen() {
  const router = useRouter();
  const { dislikedIngredients, removeDisliked } = usePreferencesStore();
  const { tier, isPremium, purchase, restore, expiresAt } = useSubscriptionStore();
  const { clearHistory, decidedMeals } = useHistoryStore();
  const premium = isPremium();

  const handlePurchase = async () => {
    await purchase();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('ありがとう！🚬', 'IQOS代ありがとう！全機能を解放しました！');
  };

  const handleRestore = async () => {
    await restore();
    Alert.alert('復元完了', '購入情報を復元しました。');
  };

  const handleClearHistory = () => {
    Alert.alert(
      '履歴を削除',
      '決定した献立の履歴をすべて削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: () => clearHistory(),
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>← 戻る</Text>
      </TouchableOpacity>

      <Text style={styles.pageTitle}>⚙️ 設定</Text>

      {/* Subscription */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>👑 プラン</Text>
        <View style={styles.card}>
          {premium ? (
            <>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>🚬 IQOS感謝プラン</Text>
              </View>
              <Text style={styles.planDetail}>
                有効期限: {expiresAt ? new Date(expiresAt).toLocaleDateString('ja-JP') : '-'}
              </Text>
              <Text style={styles.planFeatures}>
                ✅ ガチャ無制限{'\n'}
                ✅ AI献立生成{'\n'}
                ✅ 広告なし{'\n'}
                ✅ 履歴記録 & AI回避{'\n'}
                ✅ 栄養成分表示
              </Text>
            </>
          ) : (
            <>
              <View style={[styles.planBadge, styles.planBadgeFree]}>
                <Text style={[styles.planBadgeText, styles.planBadgeTextFree]}>無料プラン</Text>
              </View>
              <Text style={styles.planFeatures}>
                ✅ 1日3回ガチャ{'\n'}
                ✅ NG食材設定{'\n'}
                ❌ AI献立生成{'\n'}
                ❌ 広告あり{'\n'}
                ❌ 履歴記録
              </Text>
              <TouchableOpacity
                style={styles.purchaseButton}
                onPress={handlePurchase}
                activeOpacity={0.8}
              >
                <Text style={styles.purchaseButtonText}>
                  開発者にIQOS代をおごる 🚬
                </Text>
                <Text style={styles.purchasePrice}>¥480 / 月</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.restoreButton}
                onPress={handleRestore}
              >
                <Text style={styles.restoreButtonText}>購入を復元</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Disliked Ingredients */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          🚫 NG食材 ({dislikedIngredients.length})
        </Text>
        {dislikedIngredients.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>
              NG食材はまだ登録されていません。{'\n'}
              レシピの材料を長押しで登録できます。
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            {dislikedIngredients.map((item) => (
              <View key={item.name} style={styles.dislikedRow}>
                <Text style={styles.dislikedName}>{item.name}</Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => {
                    Haptics.selectionAsync();
                    removeDisliked(item.name);
                  }}
                >
                  <Text style={styles.removeButtonText}>解除</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* History Management */}
      {premium && decidedMeals.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 データ管理</Text>
          <View style={styles.card}>
            <Text style={styles.dataText}>
              決定した献立: {decidedMeals.length}件
            </Text>
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={handleClearHistory}
            >
              <Text style={styles.dangerButtonText}>履歴を削除</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Shopping List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🛒 買い物</Text>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push('/shopping')}
          activeOpacity={0.7}
        >
          <Text style={styles.shoppingLink}>🛒 買い物リスト</Text>
          <Text style={styles.shoppingHint}>直近の決定した献立の材料を確認できます</Text>
        </TouchableOpacity>
      </View>

      {/* Collection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🏆 コレクション</Text>
        <TouchableOpacity
          style={styles.card}
          onPress={() => {
            Haptics.selectionAsync();
            router.push('/collection');
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.collectionLink}>🏆 コレクション図鑑</Text>
          <Text style={styles.collectionHint}>お気に入りに追加したレシピを図鑑で確認</Text>
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
  planBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD54F',
    marginBottom: 12,
  },
  planBadgeFree: {
    backgroundColor: '#F5F0E8',
    borderColor: '#D4C5B5',
  },
  planBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F9A825',
  },
  planBadgeTextFree: {
    color: '#8B7355',
  },
  planDetail: {
    fontSize: 13,
    color: '#8B7355',
    marginBottom: 8,
  },
  planFeatures: {
    fontSize: 14,
    color: '#2D1B00',
    lineHeight: 26,
    marginBottom: 16,
  },
  purchaseButton: {
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    marginBottom: 10,
  },
  purchaseButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  purchasePrice: {
    fontSize: 13,
    color: '#FFD4BA',
    marginTop: 2,
  },
  restoreButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  restoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B7355',
    textDecorationLine: 'underline',
  },
  emptyText: {
    fontSize: 14,
    color: '#B0A090',
    textAlign: 'center',
    lineHeight: 22,
  },
  dislikedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5EDE4',
  },
  dislikedName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D1B00',
  },
  removeButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    backgroundColor: '#FFF0E8',
    borderRadius: 10,
  },
  removeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF6B35',
  },
  dataText: {
    fontSize: 14,
    color: '#2D1B00',
    marginBottom: 12,
  },
  dangerButton: {
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#FFEBEE',
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E53935',
  },
  shoppingLink: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 4,
  },
  shoppingHint: {
    fontSize: 13,
    color: '#8B7355',
  },
  collectionLink: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 4,
  },
  collectionHint: {
    fontSize: 13,
    color: '#8B7355',
  },
  bottomSpacer: {
    height: 40,
  },
});
