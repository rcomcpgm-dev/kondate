import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Linking,
  Share,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { useMealStore } from '../src/stores/mealStore';
import { useSubscriptionStore } from '../src/stores/subscriptionStore';
import { useHistoryStore } from '../src/stores/historyStore';
import { AdBanner } from '../src/components/AdBanner';
import { RARITY_CONFIG, rarityStars } from '../src/constants/rarity';
import { RarityBadge } from '../src/components/RarityBadge';
import type { Rarity } from '../src/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GACHA_EMOJIS = ['🍱', '🥟', '🍝', '🍜', '🌶️', '🍛', '🍣', '🥘', '🍲', '🍙'];

// Rarity reveal colors for the flash effect
const RARITY_FLASH: Record<Rarity, string> = {
  N: '#D4C5B5',
  R: '#42A5F5',
  SR: '#FFD54F',
  SSR: '#E040FB',
};

function GachaAnimation({ onComplete }: { onComplete: () => void }) {
  const [displayEmoji, setDisplayEmoji] = useState('🎰');
  const [revealPhase, setRevealPhase] = useState<'spinning' | 'flash' | null>('spinning');
  const scale = useSharedValue(0.5);
  const rotation = useSharedValue(0);
  const bgOpacity = useSharedValue(0);
  const flashOpacity = useSharedValue(0);
  const emojiIndex = useSharedValue(0);
  const isGenerating = useMealStore((s) => s.isGenerating);
  const result = useMealStore((s) => s.result);
  const minTimeElapsed = useRef(false);
  const apiDone = useRef(false);

  const updateEmoji = useCallback((index: number) => {
    setDisplayEmoji(GACHA_EMOJIS[index % GACHA_EMOJIS.length]);
  }, []);

  const doReveal = useCallback(() => {
    // Flash effect based on rarity
    setRevealPhase('flash');
    const rarity = result?.main.rarity ?? 'N';
    const isHigh = rarity === 'SR' || rarity === 'SSR';

    // Stronger haptic for higher rarity
    if (rarity === 'SSR') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 150);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy), 300);
    } else if (rarity === 'SR') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 200);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Flash animation
    flashOpacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(0, { duration: isHigh ? 600 : 300 }),
    );

    // Scale bounce on reveal (clamped to avoid going off-screen)
    scale.value = withSequence(
      withTiming(1.2, { duration: 200, easing: Easing.out(Easing.back(1.5)) }),
      withSpring(1, { damping: 12, stiffness: 120 }),
    );

    setTimeout(() => {
      onComplete();
    }, isHigh ? 800 : 500);
  }, [result, onComplete, flashOpacity, scale]);

  const tryComplete = useCallback(() => {
    if (minTimeElapsed.current && apiDone.current) {
      doReveal();
    }
  }, [doReveal]);

  useEffect(() => {
    if (!isGenerating) {
      apiDone.current = true;
      tryComplete();
    }
  }, [isGenerating, tryComplete]);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.2, { duration: 300, easing: Easing.out(Easing.back(2)) }),
      withTiming(1, { duration: 200 }),
    );

    bgOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.3, { duration: 200 }),
      ),
      -1,
      true,
    );

    rotation.value = withRepeat(
      withTiming(360, { duration: 150, easing: Easing.linear }),
      -1,
      false,
    );

    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      emojiIndex.value = frame;
      updateEmoji(frame);
    }, 80);

    const timer = setTimeout(() => {
      minTimeElapsed.current = true;
      tryComplete();
    }, 2200);

    const maxTimer = setTimeout(() => {
      minTimeElapsed.current = true;
      apiDone.current = true;
      tryComplete();
    }, 15000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
      clearTimeout(maxTimer);
    };
  }, [scale, rotation, bgOpacity, emojiIndex, updateEmoji, tryComplete]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const flashColor = result?.main.rarity ? RARITY_FLASH[result.main.rarity] : '#FFFFFF';

  return (
    <View style={styles.gachaContainer}>
      <Animated.View style={[styles.gachaBgPulse, bgStyle]} />
      {/* Rarity flash overlay */}
      <Animated.View
        style={[
          styles.rarityFlash,
          flashStyle,
          { backgroundColor: flashColor },
        ]}
      />
      <Animated.View style={containerStyle}>
        {revealPhase === 'spinning' && (
          <Animated.View style={rotationStyle}>
            <Text style={styles.gachaEmoji}>{displayEmoji}</Text>
          </Animated.View>
        )}
        {revealPhase === 'flash' && result && (
          <Text style={styles.gachaEmoji}>
            {RARITY_CONFIG[result.main.rarity].emoji}
          </Text>
        )}
      </Animated.View>
      {revealPhase === 'spinning' && (
        <>
          <Text style={styles.gachaLoadingText}>ガチャを回しています...</Text>
          <View style={styles.dotsRow}>
            {[0, 1, 2].map((i) => (
              <DotAnimation key={i} delay={i * 200} />
            ))}
          </View>
        </>
      )}
      {revealPhase === 'flash' && result && (
        <Text style={[styles.rarityRevealText, { color: RARITY_FLASH[result.main.rarity] }]}>
          {RARITY_CONFIG[result.main.rarity].label}！
        </Text>
      )}
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


interface RecipeCardProps {
  emoji: string;
  label: string;
  recipeName: string;
  cookingTime: number;
  calories?: number;
  rarity: Rarity;
  type: string;
  index: number;
}

function RecipeCard({ emoji, label, recipeName, cookingTime, calories, rarity, type, index }: RecipeCardProps) {
  const router = useRouter();
  const translateY = useSharedValue(50);
  const cardOpacity = useSharedValue(0);
  const glowScale = useSharedValue(1);
  const shimmer = useSharedValue(0);
  const config = RARITY_CONFIG[rarity];
  const isHighRarity = rarity === 'SR' || rarity === 'SSR';

  useEffect(() => {
    translateY.value = withDelay(
      index * 200,
      withSpring(0, { damping: 12, stiffness: 100 }),
    );
    cardOpacity.value = withDelay(
      index * 200,
      withTiming(1, { duration: 400 }),
    );

    // Pulsing glow for SR/SSR
    if (isHighRarity) {
      glowScale.value = withDelay(
        index * 200 + 400,
        withRepeat(
          withSequence(
            withTiming(1.01, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          ),
          -1,
          true,
        ),
      );
      shimmer.value = withDelay(
        index * 200 + 400,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 2000 }),
            withTiming(0, { duration: 2000 }),
          ),
          -1,
          true,
        ),
      );
    }
  }, [translateY, cardOpacity, glowScale, shimmer, index, isHighRarity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: isHighRarity ? glowScale.value : 1 }],
    opacity: cardOpacity.value,
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value * 0.15,
  }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[
          styles.recipeCard,
          { borderColor: config.borderColor },
          isHighRarity && {
            borderWidth: 2,
            shadowColor: config.glowColor,
            shadowOpacity: rarity === 'SSR' ? 0.3 : 0.2,
            shadowRadius: rarity === 'SSR' ? 8 : 6,
            elevation: rarity === 'SSR' ? 4 : 3,
          },
          rarity === 'SSR' && { backgroundColor: '#FFF8F5' },
        ]}
        activeOpacity={0.7}
        onPress={() => {
          Haptics.selectionAsync();
          router.push(`/recipe/${type}`);
        }}
      >
        {/* Shimmer overlay for SR/SSR */}
        {isHighRarity && (
          <Animated.View
            style={[
              styles.cardShimmer,
              shimmerStyle,
              { backgroundColor: config.glowColor },
            ]}
          />
        )}
        <View style={styles.recipeCardHeader}>
          <Text style={[styles.recipeCardEmoji, rarity === 'SSR' && { fontSize: 42 }]}>{emoji}</Text>
          <View style={styles.recipeCardInfo}>
            <View style={styles.recipeCardLabelRow}>
              <Text style={styles.recipeCardLabel}>{label}</Text>
              <RarityBadge rarity={rarity} size="small" />
            </View>
            <Text style={[
              styles.recipeCardName,
              rarity === 'SSR' && { color: config.color, fontSize: 20 },
              rarity === 'SR' && { color: '#5D4037' },
            ]}>
              {recipeName}
            </Text>
            {rarity === 'SSR' && (
              <Text style={styles.ssrStars}>{rarityStars(rarity)}</Text>
            )}
          </View>
          <Text style={styles.recipeCardArrow}>{'>'}</Text>
        </View>
        <View style={styles.recipeCardBadges}>
          <View style={[styles.badge, isHighRarity && { backgroundColor: config.bgColor }]}>
            <Text style={[styles.badgeText, isHighRarity && { color: config.color }]}>⏱️ {cookingTime}分</Text>
          </View>
          {calories != null && (
            <View style={[styles.badge, isHighRarity && { backgroundColor: config.bgColor }]}>
              <Text style={[styles.badgeText, isHighRarity && { color: config.color }]}>🔥 {calories}kcal</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ResultScreen() {
  const router = useRouter();
  const { result, isGenerating, generate, clearResult } = useMealStore();
  const isPremium = useSubscriptionStore((s) => s.isPremium());
  const addDecision = useHistoryStore((s) => s.addDecision);
  const [showResult, setShowResult] = useState(false);
  const [decided, setDecided] = useState(false);
  const headerScale = useSharedValue(0);

  const handleAnimationComplete = useCallback(() => {
    setShowResult(true);
  }, []);

  useEffect(() => {
    if (showResult) {
      headerScale.value = withSpring(1, { damping: 10, stiffness: 120 });
    }
  }, [showResult, headerScale]);

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
  }));

  const { canUseGacha, incrementGacha } = useSubscriptionStore();

  const handleRetry = async () => {
    if (!canUseGacha()) {
      router.replace('/');
      return;
    }
    incrementGacha();
    setShowResult(false);
    setDecided(false);
    headerScale.value = 0;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    generate();
  };

  const handleBack = () => {
    clearResult();
    router.back();
  };

  const handleDecide = () => {
    if (!result) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setDecided(true);
    if (isPremium) {
      addDecision(result);
    }
  };

  if (isGenerating || !showResult) {
    return <GachaAnimation onComplete={handleAnimationComplete} />;
  }

  if (!result) {
    // リロード時はresultが消えるのでホームに戻す
    router.replace('/');
    return null;
  }

  const mainRarity = result.main.rarity;
  const mainConfig = RARITY_CONFIG[mainRarity];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>← 戻る</Text>
      </TouchableOpacity>

      {/* Header with integrated rarity */}
      <Animated.View style={[
        styles.resultHeader,
        headerStyle,
        {
          backgroundColor: mainRarity === 'SSR' ? '#FFF8E1' : mainRarity === 'SR' ? '#F3E5F5' : mainRarity === 'R' ? '#E3F2FD' : '#FFFFFF',
          borderColor: mainRarity === 'SSR' ? '#FFD700' : mainRarity === 'SR' ? '#CE93D8' : mainRarity === 'R' ? '#64B5F6' : '#F0E6D8',
          borderWidth: mainRarity === 'SSR' || mainRarity === 'SR' ? 2 : 1,
        },
      ]}>
        <Text style={styles.resultEmoji}>
          {mainRarity === 'SSR' ? '🌈✨🌈' : mainRarity === 'SR' ? '✨🏆✨' : mainRarity === 'R' ? '✨' : '🎉'}
        </Text>
        <Text style={[
          styles.resultTitle,
          mainRarity === 'SSR' && { color: '#E65100' },
          mainRarity === 'SR' && { color: '#7B1FA2' },
          mainRarity === 'R' && { color: '#1565C0' },
        ]}>
          {mainRarity === 'SSR'
            ? '超激レア献立！！'
            : mainRarity === 'SR'
            ? 'スーパーレア献立！'
            : mainRarity === 'R'
            ? 'レア献立！'
            : '今日の献立'}
        </Text>
        <View style={styles.resultRarityRow}>
          <RarityBadge rarity={mainRarity} size="medium" />
        </View>
        <Text style={[
          styles.resultSubtitle,
          mainRarity === 'SSR' && { color: '#BF360C' },
          mainRarity === 'SR' && { color: '#6A1B9A' },
          mainRarity === 'R' && { color: '#0D47A1' },
        ]}>
          {mainRarity === 'SSR'
            ? 'おめでとう！確率7%の大当たり！'
            : mainRarity === 'SR'
            ? 'レストラン級の特別献立です！'
            : mainRarity === 'R'
            ? '少し特別な献立が出ました！'
            : 'あなたにぴったりの献立が決まりました！'}
        </Text>
      </Animated.View>

      {/* Recipe Cards */}
      <View style={styles.cardsContainer}>
        <RecipeCard
          emoji="🍖"
          label="主菜"
          recipeName={result.main.name}
          cookingTime={result.main.cookingTimeMinutes}
          calories={result.main.calories}
          rarity={result.main.rarity}
          type="main"
          index={0}
        />
        <RecipeCard
          emoji="🥗"
          label="副菜"
          recipeName={result.side.name}
          cookingTime={result.side.cookingTimeMinutes}
          calories={result.side.calories}
          rarity={result.side.rarity}
          type="side"
          index={1}
        />
        <RecipeCard
          emoji="🍜"
          label="汁物"
          recipeName={result.soup.name}
          cookingTime={result.soup.cookingTimeMinutes}
          calories={result.soup.calories}
          rarity={result.soup.rarity}
          type="soup"
          index={2}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {!decided ? (
          <TouchableOpacity
            style={styles.decideButton}
            onPress={handleDecide}
            activeOpacity={0.8}
          >
            <Text style={styles.decideButtonText}>✅ これに決めた！</Text>
          </TouchableOpacity>
        ) : (
          <>
            <View style={styles.decidedBanner}>
              <Text style={styles.decidedText}>🎊 決定しました！</Text>
              {!isPremium && (
                <Text style={styles.decidedHint}>IQOS代おごると履歴を記録できます 🚬</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.shoppingListButton}
              onPress={() => router.push('/shopping')}
              activeOpacity={0.8}
            >
              <Text style={styles.shoppingListButtonText}>🛒 買い物リストを見る</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.retryGachaButton}
          onPress={handleRetry}
          activeOpacity={0.8}
        >
          <Text style={styles.retryGachaText}>🎰 もう一回回す</Text>
        </TouchableOpacity>
      </View>

      {/* Share */}
      <View style={styles.shareSection}>
        <Text style={styles.shareSectionTitle}>📣 今日の献立をシェア</Text>
        <View style={styles.shareRow}>
          <TouchableOpacity
            style={styles.shareXBtn}
            onPress={() => {
              const shareUrl = `https://kondate-nu.vercel.app/?recipe=${encodeURIComponent(result.main.name)}&rarity=${result.main.rarity}`;
              const text = `今日の献立ガチャ🎰\n🍖 ${result.main.name}【${result.main.rarity}】\n🥗 ${result.side.name}\n🍜 ${result.soup.name}\n#献立ガチャ #今日のごはん\n${shareUrl}`;
              const url = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`;
              Linking.openURL(url);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.shareXBtnText}>𝕏 ポスト</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareInstaBtn}
            onPress={() => {
              // Instagram doesn't have a direct share URL, so use system share or copy text
              const text = `今日の献立ガチャ🎰\n🍖 ${result.main.name}\n🥗 ${result.side.name}\n🍜 ${result.soup.name}\n#献立ガチャ #今日のごはん`;
              if (Platform.OS === 'web') {
                // On web, copy to clipboard and open Instagram
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(text);
                }
                Linking.openURL('https://www.instagram.com/');
              } else {
                Share.share({ message: text });
              }
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.shareInstaBtnText}>📸 Instagram</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.shareOtherBtn}
            onPress={() => {
              const text = `今日の献立ガチャ🎰\n🍖 ${result.main.name}\n🥗 ${result.side.name}\n🍜 ${result.soup.name}`;
              Share.share({ message: text });
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.shareOtherBtnText}>↗️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!isPremium && (
        <AdBanner size="rectangle" adId="885eddc4d4ad85e4695a6ab1e5320460" />
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
  // Gacha Animation
  gachaContainer: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gachaBgPulse: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: '100%',
    backgroundColor: '#FFE4D6',
  },
  rarityFlash: {
    position: 'absolute',
    width: SCREEN_WIDTH * 2,
    height: '200%',
  },
  gachaEmoji: {
    fontSize: 96,
  },
  gachaLoadingText: {
    marginTop: 24,
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B35',
  },
  rarityRevealText: {
    marginTop: 16,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 2,
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
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  // Result header
  resultHeader: {
    alignItems: 'center',
    marginBottom: 28,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  resultEmoji: {
    fontSize: 36,
    marginBottom: 6,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#2D1B00',
    textAlign: 'center',
  },
  resultRarityRow: {
    marginTop: 10,
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#8B7355',
    textAlign: 'center',
  },
  // (RarityBadge styles now in src/components/RarityBadge.tsx)
  ssrStars: {
    fontSize: 12,
    color: '#E040FB',
    marginTop: 2,
    letterSpacing: 2,
  },
  cardShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  // Cards
  cardsContainer: {
    gap: 14,
  },
  recipeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0E6D8',
  },
  recipeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeCardEmoji: {
    fontSize: 36,
    marginRight: 14,
  },
  recipeCardInfo: {
    flex: 1,
  },
  recipeCardLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  recipeCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B35',
  },
  recipeCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D1B00',
  },
  recipeCardArrow: {
    fontSize: 18,
    color: '#C4B5A5',
    fontWeight: '600',
  },
  recipeCardBadges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#FFF0E8',
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF8C5A',
  },
  // Actions
  actions: {
    marginTop: 28,
    gap: 12,
  },
  decideButton: {
    paddingVertical: 18,
    borderRadius: 24,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  decideButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  decidedBanner: {
    paddingVertical: 16,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  decidedText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4CAF50',
  },
  decidedHint: {
    fontSize: 12,
    color: '#81C784',
    marginTop: 4,
  },
  shoppingListButton: {
    paddingVertical: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  shoppingListButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FF6B35',
  },
  retryGachaButton: {
    paddingVertical: 18,
    borderRadius: 24,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  retryGachaText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  // Share
  shareSection: {
    marginTop: 24,
  },
  shareSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D1B00',
    marginBottom: 10,
    textAlign: 'center',
  },
  shareRow: {
    flexDirection: 'row',
    gap: 10,
  },
  shareXBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  shareXBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shareInstaBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#E1306C',
    alignItems: 'center',
  },
  shareInstaBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shareOtherBtn: {
    width: 48,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F0E6D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareOtherBtnText: {
    fontSize: 18,
  },
  // Error
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
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FF6B35',
    borderRadius: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomSpacer: {
    height: 40,
  },
});
