import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

interface AdBannerProps {
  adId?: string;
  size?: 'banner' | 'rectangle';
}

function WebAdBanner({ adId, size }: { adId: string; size: 'banner' | 'rectangle' }) {
  const ref = useRef<View>(null);
  const [mounted, setMounted] = useState(false);
  const height = size === 'banner' ? 60 : 250;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // React Native Web の View は実際には div 要素
    // ref.current から実 DOM ノードを取得
    const node = ref.current as unknown as HTMLElement | null;
    if (!node) return;

    // 広告用のコンテナを作成
    const adContainer = document.createElement('div');
    adContainer.id = `admax-${adId}`;
    adContainer.style.width = '100%';
    adContainer.style.minHeight = `${height}px`;
    adContainer.style.display = 'flex';
    adContainer.style.alignItems = 'center';
    adContainer.style.justifyContent = 'center';

    const script = document.createElement('script');
    script.src = `https://adm.shinobi.jp/s/${adId}`;
    script.async = true;

    node.appendChild(adContainer);
    adContainer.appendChild(script);

    return () => {
      if (node.contains(adContainer)) {
        node.removeChild(adContainer);
      }
    };
  }, [mounted, adId, height]);

  return (
    <View
      ref={ref}
      style={[styles.container, { minHeight: height }]}
    />
  );
}

export function AdBanner({ adId, size = 'banner' }: AdBannerProps) {
  const height = size === 'banner' ? 60 : 250;

  if (Platform.OS === 'web' && adId) {
    return <WebAdBanner adId={adId} size={size} />;
  }

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
