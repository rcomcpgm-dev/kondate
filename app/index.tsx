import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useMealStore } from '../src/stores/mealStore';
import { useSubscriptionStore } from '../src/stores/subscriptionStore';
import { usePreferencesStore } from '../src/stores/preferencesStore';
import { RewardAdModal } from '../src/components/RewardAdModal';
import { useHistoryStore } from '../src/stores/historyStore';
import { getItem } from '../src/lib/storage';
import {
  MEAL_TIMES,
  GENRES,
  MOODS,
  COOKING_TIMES,
  SERVINGS_OPTIONS,
} from '../src/constants/options';
import type { MealTime, Genre, Mood, CookingTime, Servings, GentleOption } from '../src/types';
import { getCurrentSeason } from '../src/constants/seasonal';

const VISITED_KEY = 'kondate-visited';

const GENTLE_OPTIONS: { id: GentleOption; label: string; emoji: string; desc: string }[] = [
  { id: 'easyDigest', label: '消化にやさしい', emoji: '🍵', desc: '風邪・胃腸' },
  { id: 'lowSalt', label: '塩分ひかえめ', emoji: '🧂', desc: '高血圧' },
  { id: 'lowCarb', label: '糖質ひかえめ', emoji: '🍚', desc: '糖尿病' },
  { id: 'lowFat', label: '脂質ひかえめ', emoji: '🫒', desc: '脂質異常症' },
  { id: 'lowProtein', label: 'たんぱく質ひかえめ', emoji: '🥩', desc: '腎臓病' },
  { id: 'lowPurine', label: 'プリン体ひかえめ', emoji: '🦐', desc: '痛風' },
];

function UpsellModal({
  visible,
  onClose,
  onPurchase,
  onWatchAd,
  canWatchAd,
}: {
  visible: boolean;
  onClose: () => void;
  onPurchase: () => void;
  onWatchAd: () => void;
  canWatchAd: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalEmoji}>🎰</Text>
          <Text style={styles.modalTitle}>今日のガチャを使い切りました</Text>

          {/* Reward ad option */}
          {canWatchAd && (
            <TouchableOpacity
              style={styles.modalRewardBtn}
              onPress={onWatchAd}
              activeOpacity={0.8}
            >
              <Text style={styles.modalRewardText}>🎬 広告を見てガチャ+1回</Text>
              <Text style={styles.modalRewardSub}>無料・あと数回使えます</Text>
            </TouchableOpacity>
          )}

          {/* Divider */}
          <View style={styles.modalDivider}>
            <View style={styles.modalDividerLine} />
            <Text style={styles.modalDividerText}>または</Text>
            <View style={styles.modalDividerLine} />
          </View>

          <Text style={styles.modalDesc}>
            プレミアムプランは現在準備中です{'\n'}
            もうしばらくお待ちください
          </Text>
          <View style={styles.modalFeatures}>
            <Text style={styles.modalFeature}>ガチャ無制限</Text>
            <Text style={styles.modalFeature}>AI献立生成（NG食材回避）</Text>
            <Text style={styles.modalFeature}>広告なし</Text>
            <Text style={styles.modalFeature}>献立履歴＆繰り返し防止</Text>
            <Text style={styles.modalFeature}>栄養成分表示</Text>
            <Text style={styles.modalFeature}>週間献立モード</Text>
          </View>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
            <Text style={styles.modalCloseText}>明日まで待つ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [ftueChecked, setFtueChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    getItem<boolean>(VISITED_KEY).then((visited) => {
      if (!mounted) return;
      if (!visited) {
        router.replace('/lp');
      } else {
        setFtueChecked(true);
      }
    });
    return () => { mounted = false; };
  }, [router]);

  const [showUpsell, setShowUpsell] = useState(false);
  const [showRewardAd, setShowRewardAd] = useState(false);
  const {
    selection,
    setMealTime,
    setGenre,
    toggleMood,
    setCookingTime,
    setServings,
    setDietMode,
    setBingeMode,
    setBeginnerMode,
    setGentleMode,
    toggleGentleOption,
    generate,
  } = useMealStore();
  const {
    canUseGacha,
    incrementGacha,
    isPremium,
    getRemaining,
    getDailyLimit,
    canWatchRewardAd,
    addRewardBonus,
    purchase,
  } = useSubscriptionStore();
  const dislikedCount = usePreferencesStore((s) => s.dislikedIngredients.length);
  const historyCount = useHistoryStore((s) => s.decidedMeals.length);
  const premium = isPremium();
  const remaining = getRemaining();
  const dailyLimit = getDailyLimit();
  const seasonalData = getCurrentSeason();

  const handleWeekly = () => {
    if (premium) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push('/weekly');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setShowUpsell(true);
    }
  };

  const handleGacha = async () => {
    if (!canUseGacha()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setShowUpsell(true);
      return;
    }
    incrementGacha();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    generate();
    router.push('/result');
  };

  const handleUpsellPurchase = async () => {
    await purchase();
    setShowUpsell(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // For the progress bar
  const remainingRatio = premium ? 1 : remaining / dailyLimit;
  const isLow = !premium && remaining <= Math.ceil(dailyLimit * 0.3);

  if (!ftueChecked) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            {premium && historyCount > 0 ? (
              <TouchableOpacity
                style={styles.historyButton}
                onPress={() => router.push('/history')}
              >
                <Text style={styles.historyButtonText}>📋 {historyCount}</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.headerSpacer} />
            )}
            <View style={styles.headerCenter}>
              <Text style={styles.headerEmoji}>🎰</Text>
              <Text style={styles.headerTitle}>献立ガチャ</Text>
              <Text style={styles.headerSubtitle}>今日のごはん、ガチャで決めよう！</Text>
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push('/settings')}
            >
              <Text style={styles.settingsButtonText}>⚙️</Text>
              {dislikedCount > 0 && (
                <View style={styles.settingsBadge}>
                  <Text style={styles.settingsBadgeText}>{dislikedCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Remaining counter / Premium badge */}
          {premium ? (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>🚬 IQOS感謝 ─ 全機能解放中</Text>
            </View>
          ) : (
            <View style={styles.remainingContainer}>
              <View style={styles.remainingHeader}>
                <Text style={[styles.remainingLabel, isLow && styles.remainingLabelLow]}>
                  🎫 残り
                </Text>
                <Text style={[styles.remainingCount, isLow && styles.remainingCountLow]}>
                  {remaining}
                </Text>
                <Text style={[styles.remainingLabel, isLow && styles.remainingLabelLow]}>
                  / {dailyLimit}回
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.max(remainingRatio * 100, 0)}%`,
                      backgroundColor: isLow ? '#FF4444' : '#FF6B35',
                    },
                  ]}
                />
              </View>
              {isLow && remaining > 0 && (
                <Text style={styles.remainingHint}>あと少し！</Text>
              )}
              {remaining === 0 && (
                <>
                  {canWatchRewardAd() && (
                    <TouchableOpacity
                      style={styles.rewardAdMini}
                      onPress={() => setShowRewardAd(true)}
                    >
                      <Text style={styles.rewardAdMiniText}>
                        🎬 広告を見てガチャ+1回
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.upsellMini}
                    onPress={() => setShowUpsell(true)}
                  >
                    <Text style={styles.upsellMiniText}>
                      プレミアムプラン準備中...
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>

        {/* Mode Toggles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 モード</Text>

          {/* Volume segment: diet / standard / binge */}
          <View style={styles.segmentContainer}>
            <TouchableOpacity
              style={[
                styles.segmentLeft,
                selection.dietMode && styles.segmentDietActive,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setDietMode(!selection.dietMode);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.segmentEmoji}>🥗</Text>
              <Text style={[styles.segmentLabel, selection.dietMode && styles.segmentDietLabelActive]}>
                ダイエット
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentCenter,
                !selection.dietMode && !selection.bingeMode && styles.segmentStandardActive,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setDietMode(false);
                setBingeMode(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.segmentEmoji}>🍽️</Text>
              <Text style={[styles.segmentLabel, !selection.dietMode && !selection.bingeMode && styles.segmentStandardLabelActive]}>
                標準
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentRight,
                selection.bingeMode && styles.segmentBingeActive,
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setBingeMode(!selection.bingeMode);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.segmentEmoji}>🍖</Text>
              <Text style={[styles.segmentLabel, selection.bingeMode && styles.segmentBingeLabelActive]}>
                爆食
              </Text>
            </TouchableOpacity>
          </View>

          {/* Other mode toggles */}
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeToggle, selection.beginnerMode && styles.modeToggleActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setBeginnerMode(!selection.beginnerMode);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.modeToggleEmoji}>🔰</Text>
              <Text style={[styles.modeToggleLabel, selection.beginnerMode && styles.modeToggleLabelActive]}>
                初心者
              </Text>
              <Text style={[styles.modeToggleDesc, selection.beginnerMode && styles.modeToggleDescActive]}>
                かんたん料理
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeToggle, selection.gentleMode && styles.modeToggleGentleActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setGentleMode(!selection.gentleMode);
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.modeToggleEmoji}>🤒</Text>
              <Text style={[styles.modeToggleLabel, selection.gentleMode && styles.modeToggleGentleLabelActive]}>
                おだいじに
              </Text>
              <Text style={[styles.modeToggleDesc, selection.gentleMode && styles.modeToggleGentleDescActive]}>
                体にやさしく
              </Text>
            </TouchableOpacity>
          </View>

          {/* Gentle sub-options */}
          {selection.gentleMode && (
            <View style={styles.gentleOptionsContainer}>
              <Text style={styles.gentleOptionsHint}>制限したい項目を選択（複数OK）</Text>
              <View style={styles.gentleOptionsWrap}>
                {GENTLE_OPTIONS.map((opt) => {
                  const isActive = selection.gentleOptions.includes(opt.id);
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.gentleChip, isActive && styles.gentleChipActive]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        toggleGentleOption(opt.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.gentleChipEmoji}>{opt.emoji}</Text>
                      <View>
                        <Text style={[styles.gentleChipLabel, isActive && styles.gentleChipLabelActive]}>
                          {opt.label}
                        </Text>
                        <Text style={[styles.gentleChipDesc, isActive && styles.gentleChipDescActive]}>
                          {opt.desc}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Seasonal Banner */}
        {seasonalData && (
          <View style={styles.seasonalBanner}>
            <Text style={styles.seasonalText}>
              🌸 今月の旬: {seasonalData.ingredients.slice(0, 5).join('・')}
            </Text>
          </View>
        )}

        {/* Meal Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🕐 いつのごはん？</Text>
          <View style={styles.pillRow}>
            {MEAL_TIMES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.pill,
                  selection.mealTime === item.id && styles.pillActive,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setMealTime(item.id as MealTime);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pillText,
                    selection.mealTime === item.id && styles.pillTextActive,
                  ]}
                >
                  {item.emoji} {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Genre */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🍽️ ジャンル</Text>
          <View style={styles.genreWrap}>
            {GENRES.map((item) => {
              const isActive = selection.genre === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.genreChip, isActive && styles.genreChipActive]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setGenre(item.id as Genre);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.genreChipEmoji}>{item.emoji}</Text>
                  <Text style={[styles.genreChipLabel, isActive && styles.genreChipLabelActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Mood */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💭 気分は？（複数OK）</Text>
          <View style={styles.chipRow}>
            <TouchableOpacity
              style={[styles.chip, selection.moods.length === 0 && styles.chipActive]}
              onPress={() => {
                Haptics.selectionAsync();
                // Clear all moods
                selection.moods.forEach((m) => toggleMood(m));
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.chipText,
                  selection.moods.length === 0 && styles.chipTextActive,
                ]}
              >
                🎲 おまかせ
              </Text>
            </TouchableOpacity>
            {MOODS.map((item) => {
              const isSelected = selection.moods.includes(item.id as Mood);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    toggleMood(item.id as Mood);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected && styles.chipTextActive,
                    ]}
                  >
                    {item.emoji} {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Cooking Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏱️ 調理時間</Text>
          <View style={styles.timeRow}>
            {COOKING_TIMES.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.timeCard,
                  selection.cookingTime === item.id && styles.timeCardActive,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setCookingTime(item.id as CookingTime);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.timeEmoji}>{item.emoji}</Text>
                <Text
                  style={[
                    styles.timeLabel,
                    selection.cookingTime === item.id && styles.timeLabelActive,
                  ]}
                >
                  {item.label}
                </Text>
                <Text
                  style={[
                    styles.timeDesc,
                    selection.cookingTime === item.id && styles.timeDescActive,
                  ]}
                >
                  {item.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Servings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 何人分？</Text>
          <View style={styles.pillRow}>
            {SERVINGS_OPTIONS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.pill,
                  selection.servings === item.id && styles.pillActive,
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setServings(item.id as Servings);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pillText,
                    selection.servings === item.id && styles.pillTextActive,
                  ]}
                >
                  {item.emoji} {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Gacha Button */}
        <TouchableOpacity
          style={[
            styles.gachaButton,
            !premium && remaining === 0 && styles.gachaButtonDisabled,
          ]}
          onPress={handleGacha}
          activeOpacity={0.8}
        >
          <Text style={styles.gachaButtonEmoji}>🎰</Text>
          <Text style={styles.gachaButtonText}>
            {!premium && remaining === 0
              ? '本日分を使い切りました'
              : '献立ガチャを回す！'}
          </Text>
        </TouchableOpacity>

        {/* Reward Ad Button (shown when gacha depleted) */}
        {!premium && remaining === 0 && canWatchRewardAd() && (
          <TouchableOpacity
            style={styles.rewardAdButton}
            onPress={() => setShowRewardAd(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.rewardAdButtonText}>🎬 広告を見てガチャ+1回もらう</Text>
          </TouchableOpacity>
        )}

        {/* Weekly Meal Plan Button */}
        <TouchableOpacity
          style={styles.weeklyButton}
          onPress={handleWeekly}
          activeOpacity={0.8}
        >
          <View style={styles.weeklyButtonContent}>
            <Text style={styles.weeklyButtonEmoji}>📅</Text>
            <View style={styles.weeklyButtonTextContainer}>
              <Text style={styles.weeklyButtonText}>週間献立モード</Text>
              <Text style={styles.weeklyButtonDesc}>1週間分まとめて生成</Text>
            </View>
            {!premium && (
              <View style={styles.weeklyPremiumBadge}>
                <Text style={styles.weeklyPremiumBadgeText}>Premium</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <UpsellModal
        visible={showUpsell}
        onClose={() => setShowUpsell(false)}
        onPurchase={handleUpsellPurchase}
        onWatchAd={() => {
          setShowUpsell(false);
          setShowRewardAd(true);
        }}
        canWatchAd={canWatchRewardAd()}
      />
      <RewardAdModal
        visible={showRewardAd}
        onClose={() => setShowRewardAd(false)}
        onRewardEarned={() => {
          addRewardBonus();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    justifyContent: 'space-between',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FF6B35',
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8B7355',
    marginTop: 4,
  },
  settingsButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButtonText: {
    fontSize: 24,
  },
  settingsBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  historyButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#FFF0E8',
    borderRadius: 12,
  },
  historyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
  },
  premiumBadge: {
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 18,
    backgroundColor: '#FFF8E1',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FFD54F',
  },
  premiumBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F9A825',
  },
  // Remaining counter
  remainingContainer: {
    marginTop: 14,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0E6D8',
  },
  remainingHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 10,
  },
  remainingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B7355',
  },
  remainingLabelLow: {
    color: '#FF4444',
  },
  remainingCount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FF6B35',
    marginHorizontal: 6,
  },
  remainingCountLow: {
    color: '#FF4444',
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F0E6D8',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  remainingHint: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#FF4444',
    marginTop: 6,
  },
  rewardAdMini: {
    marginTop: 8,
    paddingVertical: 8,
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#42A5F5',
  },
  rewardAdMiniText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1976D2',
  },
  upsellMini: {
    marginTop: 8,
    paddingVertical: 8,
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD54F',
  },
  upsellMiniText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F9A825',
  },
  // Volume segment (diet / standard / binge)
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0D8CC',
    overflow: 'hidden',
    marginBottom: 12,
  },
  segmentLeft: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E0D8CC',
  },
  segmentCenter: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E0D8CC',
  },
  segmentRight: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  segmentEmoji: {
    fontSize: 22,
    marginBottom: 4,
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8B7355',
  },
  segmentDietActive: {
    backgroundColor: '#E8F5E9',
  },
  segmentDietLabelActive: {
    color: '#2E7D32',
  },
  segmentStandardActive: {
    backgroundColor: '#FFF3E0',
  },
  segmentStandardLabelActive: {
    color: '#E65100',
  },
  segmentBingeActive: {
    backgroundColor: '#FFEBEE',
  },
  segmentBingeLabelActive: {
    color: '#C62828',
  },
  // Mode toggles
  modeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modeToggle: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F0E6D8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modeToggleActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  modeToggleEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  modeToggleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D1B00',
  },
  modeToggleLabelActive: {
    color: '#2E7D32',
  },
  modeToggleDesc: {
    fontSize: 11,
    color: '#8B7355',
    marginTop: 2,
  },
  modeToggleDescActive: {
    color: '#4CAF50',
  },
  modeToggleGentleActive: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  modeToggleGentleLabelActive: {
    color: '#E65100',
  },
  modeToggleGentleDescActive: {
    color: '#FF9800',
  },
  // Gentle sub-options
  gentleOptionsContainer: {
    marginTop: 12,
    backgroundColor: '#FFF8F0',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  gentleOptionsHint: {
    fontSize: 12,
    color: '#8B7355',
    marginBottom: 10,
    textAlign: 'center',
  },
  gentleOptionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gentleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E0D5C5',
    gap: 6,
  },
  gentleChipActive: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
  },
  gentleChipEmoji: {
    fontSize: 18,
  },
  gentleChipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D1B00',
  },
  gentleChipLabelActive: {
    color: '#E65100',
  },
  gentleChipDesc: {
    fontSize: 10,
    color: '#A09080',
  },
  gentleChipDescActive: {
    color: '#FF9800',
  },
  // Seasonal banner
  seasonalBanner: {
    marginBottom: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#FFF8F0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    alignItems: 'center',
  },
  seasonalText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B7355',
  },
  // Sections
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2D1B00',
    marginBottom: 12,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F0E6D8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pillActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1B00',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  // Genre - wrap chips
  genreWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F0E6D8',
    gap: 4,
  },
  genreChipActive: {
    backgroundColor: '#FFF0E8',
    borderColor: '#FF6B35',
  },
  genreChipEmoji: {
    fontSize: 16,
  },
  genreChipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D1B00',
  },
  genreChipLabelActive: {
    color: '#FF6B35',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F0E6D8',
  },
  chipActive: {
    backgroundColor: '#FFF0E8',
    borderColor: '#FF6B35',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D1B00',
  },
  chipTextActive: {
    color: '#FF6B35',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  timeCard: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F0E6D8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  timeCardActive: {
    backgroundColor: '#FFF0E8',
    borderColor: '#FF6B35',
  },
  timeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D1B00',
    marginBottom: 2,
  },
  timeLabelActive: {
    color: '#FF6B35',
  },
  timeDesc: {
    fontSize: 11,
    color: '#8B7355',
  },
  timeDescActive: {
    color: '#FF8C5A',
  },
  gachaButton: {
    marginTop: 8,
    marginBottom: 12,
    paddingVertical: 20,
    borderRadius: 28,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  gachaButtonDisabled: {
    backgroundColor: '#C4B5A5',
    shadowColor: '#C4B5A5',
  },
  rewardAdButton: {
    marginTop: 12,
    paddingVertical: 16,
    borderRadius: 24,
    backgroundColor: '#1976D2',
    alignItems: 'center',
    marginHorizontal: 20,
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  rewardAdButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  gachaButtonEmoji: {
    fontSize: 36,
    marginBottom: 4,
  },
  gachaButtonText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  // Weekly button
  weeklyButton: {
    marginTop: 12,
    marginBottom: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#FFD54F',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  weeklyButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weeklyButtonEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  weeklyButtonTextContainer: {
    flex: 1,
  },
  weeklyButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#2D1B00',
  },
  weeklyButtonDesc: {
    fontSize: 12,
    color: '#8B7355',
    marginTop: 2,
  },
  weeklyPremiumBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFD54F',
  },
  weeklyPremiumBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F9A825',
  },
  bottomSpacer: {
    height: 40,
  },
  // Upsell Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  modalEmoji: {
    fontSize: 56,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D1B00',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalFeatures: {
    alignSelf: 'stretch',
    marginBottom: 24,
    gap: 6,
  },
  modalFeature: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D1B00',
    lineHeight: 24,
  },
  modalPurchaseBtn: {
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
  modalPurchaseText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalPurchasePrice: {
    fontSize: 13,
    color: '#FFD4BA',
    marginTop: 2,
  },
  modalCloseBtn: {
    paddingVertical: 10,
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0A090',
  },
  modalRewardBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 20,
    backgroundColor: '#1976D2',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#1976D2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalRewardText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalRewardSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  modalDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 16,
  },
  modalDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0D8CC',
  },
  modalDividerText: {
    fontSize: 12,
    color: '#B0A090',
    marginHorizontal: 12,
  },
});
