import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';

function useWebSEO() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    document.title = '献立ガチャ｜3秒で今日の晩ごはんが決まる無料アプリ';

    const setMeta = (name: string, content: string, attr = 'name') => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMeta('description', '毎日の「何作ろう…」をガチャで解決。気分とジャンルを選んでガチャを回すだけで、主菜・副菜・汁物の献立が3秒で決まります。無料・登録不要。');
    setMeta('keywords', '献立,献立ガチャ,今日の献立,晩ごはん,レシピ,献立アプリ,料理,時短');
    setMeta('og:title', '献立ガチャ｜3秒で今日の晩ごはんが決まる', 'property');
    setMeta('og:description', 'ガチャを回すだけ。主菜・副菜・汁物の献立が3秒で決まる無料アプリ。', 'property');
    setMeta('og:type', 'website', 'property');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', '献立ガチャ｜3秒で今日の晩ごはんが決まる');
    setMeta('twitter:description', 'ガチャを回すだけ。主菜・副菜・汁物の献立が3秒で決まる無料アプリ。');
  }, []);
}

const PAIN_POINTS = [
  { emoji: '🤔', text: '毎日の献立に悩む時間、年間150時間' },
  { emoji: '😩', text: 'レシピ検索しても結局決まらない' },
  { emoji: '🔄', text: '同じメニューのループから抜け出せない' },
];

const STEPS = [
  { num: '1', emoji: '🎯', text: '気分とジャンルを選ぶ' },
  { num: '2', emoji: '🎰', text: 'ガチャを回す' },
  { num: '3', emoji: '🍽️', text: '主菜・副菜・汁物の献立が決まる' },
];

const FEATURES = [
  { emoji: '🎲', title: '10ジャンル対応', desc: '和食・洋食・中華など幅広く' },
  { emoji: '🥗', title: 'ダイエット・初心者モード', desc: 'カロリー制限＆簡単レシピ' },
  { emoji: '🤒', title: 'おだいじにモード', desc: '体調に合わせた優しい献立' },
  { emoji: '📊', title: 'カロリー管理グラフ', desc: '日々の栄養バランスを可視化' },
];

export default function LandingPage() {
  const router = useRouter();
  useWebSEO();

  const handleCTA = () => {
    router.replace('/');
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ===== Hero ===== */}
      <View style={styles.heroSection}>
        <Text style={styles.heroEmoji}>🎰</Text>
        <Text style={styles.heroHeadline}>
          今日の献立、{'\n'}まだ決まらない？
        </Text>
        <Text style={styles.heroSub}>
          ガチャを回すだけ。{'\n'}3秒で晩ごはんが決まる。
        </Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleCTA}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaButtonText}>🎰 無料でガチャを回す</Text>
        </TouchableOpacity>
      </View>

      {/* ===== Pain Points ===== */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          毎日の「何作ろう…」をなくそう
        </Text>
        <View style={styles.painList}>
          {PAIN_POINTS.map((item, i) => (
            <View key={i} style={styles.painItem}>
              <Text style={styles.painEmoji}>{item.emoji}</Text>
              <Text style={styles.painText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ===== How it works ===== */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>使い方はかんたん3ステップ</Text>
        <View style={styles.stepsList}>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.stepItem}>
              <View style={styles.stepNumCircle}>
                <Text style={styles.stepNum}>{step.num}</Text>
              </View>
              <Text style={styles.stepEmoji}>{step.emoji}</Text>
              <Text style={styles.stepText}>{step.text}</Text>
              {i < STEPS.length - 1 && (
                <Text style={styles.stepArrow}>↓</Text>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* ===== Features ===== */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>充実の機能</Text>
        <View style={styles.featuresGrid}>
          {FEATURES.map((feat, i) => (
            <View key={i} style={styles.featureCard}>
              <Text style={styles.featureEmoji}>{feat.emoji}</Text>
              <Text style={styles.featureTitle}>{feat.title}</Text>
              <Text style={styles.featureDesc}>{feat.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ===== Final CTA ===== */}
      <View style={styles.finalCTASection}>
        <Text style={styles.finalCTAHeadline}>
          無料で使える。登録不要。
        </Text>
        <Text style={styles.finalCTASub}>
          今すぐ献立の悩みから解放されよう
        </Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handleCTA}
          activeOpacity={0.8}
        >
          <Text style={styles.ctaButtonText}>🎰 無料でガチャを回す</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>献立ガチャ</Text>
        <Text style={styles.footerCopy}>
          &copy; {new Date().getFullYear()} 献立ガチャ
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
  },
  content: {
    paddingBottom: 40,
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  heroEmoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  heroHeadline: {
    fontSize: 32,
    fontWeight: '900',
    color: '#2D1B00',
    textAlign: 'center',
    lineHeight: 44,
    letterSpacing: 1,
  },
  heroSub: {
    fontSize: 17,
    color: '#8B7355',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 26,
  },

  // CTA Button (shared)
  ctaButton: {
    marginTop: 28,
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 28,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    width: '100%',
    maxWidth: 340,
  },
  ctaButtonText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },

  // Section
  section: {
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2D1B00',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 34,
  },

  // Pain Points
  painList: {
    gap: 14,
  },
  painItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0E6D8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  painEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  painText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D1B00',
    flex: 1,
    lineHeight: 24,
  },

  // Steps
  stepsList: {
    alignItems: 'center',
    gap: 4,
  },
  stepItem: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    paddingVertical: 22,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F0E6D8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 4,
  },
  stepNumCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepNum: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  stepText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D1B00',
    textAlign: 'center',
    lineHeight: 24,
  },
  stepArrow: {
    fontSize: 24,
    color: '#FF6B35',
    marginTop: 8,
    fontWeight: '600',
  },

  // Features
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0E6D8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureEmoji: {
    fontSize: 36,
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D1B00',
    textAlign: 'center',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    color: '#8B7355',
    textAlign: 'center',
    lineHeight: 18,
  },

  // Final CTA
  finalCTASection: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#F0E6D8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  finalCTAHeadline: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2D1B00',
    textAlign: 'center',
    letterSpacing: 1,
  },
  finalCTASub: {
    fontSize: 15,
    color: '#8B7355',
    marginTop: 8,
    textAlign: 'center',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#C4B5A5',
  },
  footerCopy: {
    fontSize: 12,
    color: '#C4B5A5',
    marginTop: 4,
  },
});
