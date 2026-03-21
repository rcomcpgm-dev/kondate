import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

interface AdBannerProps {
  adId?: string;
  size?: 'banner' | 'rectangle';
}

function WebAdBanner({ adId, size }: { adId: string; size: 'banner' | 'rectangle' }) {
  const width = size === 'banner' ? 320 : 300;
  const height = size === 'banner' ? 50 : 250;

  // iframe内でscriptを実行することでdocument.writeに対応
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
body{margin:0;padding:0;display:flex;align-items:center;justify-content:center;min-height:${height}px;overflow:hidden;}
</style></head><body>
<script src="https://adm.shinobi.jp/s/${adId}"></script>
</body></html>`;

  const srcDoc = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;

  return (
    <View style={[styles.container, { minHeight: height }]}>
      <iframe
        src={srcDoc}
        width={width}
        height={height}
        style={{
          border: 'none',
          overflow: 'hidden',
          display: 'block',
          margin: '0 auto',
        }}
        scrolling="no"
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
        title="ad"
      />
    </View>
  );
}

export function AdBanner({ adId, size = 'banner' }: AdBannerProps) {
  const height = size === 'banner' ? 50 : 250;

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
