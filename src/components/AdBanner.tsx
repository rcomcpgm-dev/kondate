import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

interface AdBannerProps {
  /** 忍者AdMax 広告枠ID（取得後に設定） */
  adId?: string;
  /** 広告サイズ */
  size?: 'banner' | 'rectangle';
}

/**
 * 広告バナーコンポーネント
 * - adId未設定時はプレースホルダー表示
 * - Web: 忍者AdMax scriptを動的挿入
 * - Native: プレースホルダーのみ（将来的にAdMob等）
 */
export function AdBanner({ adId, size = 'banner' }: AdBannerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isBanner = size === 'banner';
  const height = isBanner ? 60 : 250;

  useEffect(() => {
    if (Platform.OS !== 'web' || !adId) return;

    // 忍者AdMax: scriptタグを動的に挿入
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';
    const script = document.createElement('script');
    script.src = `https://adm.shinobi.jp/s/${adId}`;
    script.async = true;
    container.appendChild(script);

    return () => {
      if (container) container.innerHTML = '';
    };
  }, [adId]);

  if (Platform.OS === 'web' && adId) {
    return (
      <View style={[styles.container, { minHeight: height }]}>
        <div
          ref={containerRef as React.RefObject<HTMLDivElement>}
          style={{ width: '100%', minHeight: height, textAlign: 'center' }}
        />
      </View>
    );
  }

  // プレースホルダー（adId未設定時）
  return (
    <View style={[styles.placeholder, { height }]}>
      <Text style={styles.placeholderText}>- 広告 -</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 12,
  },
  placeholder: {
    marginTop: 24,
    backgroundColor: '#F5F0E8',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0D8CC',
  },
  placeholderText: {
    fontSize: 14,
    color: '#B0A090',
  },
});
