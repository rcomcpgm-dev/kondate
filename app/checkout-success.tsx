import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSubscriptionStore } from '../src/stores/subscriptionStore';
import { getSubscriptionStatus } from '../src/lib/subscriptionApi';

export default function CheckoutSuccessScreen() {
  const router = useRouter();
  const { session_id } = useLocalSearchParams<{ session_id: string }>();
  const [error, setError] = useState<string | null>(null);
  const activateFromCheckout = useSubscriptionStore((s) => s.activateFromCheckout);

  useEffect(() => {
    if (!session_id) {
      router.replace('/settings');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const status = await getSubscriptionStatus({ sessionId: session_id });
        if (cancelled) return;

        if (status.tier === 'premium' && status.token) {
          activateFromCheckout(
            status.token,
            status.expiresAt!,
            status.customerId!,
          );
        }

        // Navigate to settings after a brief moment
        setTimeout(() => {
          if (!cancelled) router.replace('/settings');
        }, 2000);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'エラーが発生しました');
          setTimeout(() => {
            if (!cancelled) router.replace('/settings');
          }, 3000);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session_id]);

  return (
    <View style={styles.container}>
      {error ? (
        <>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.redirectText}>設定画面に戻ります...</Text>
        </>
      ) : (
        <>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.title}>ありがとう！</Text>
          <Text style={styles.subtitle}>サブスクリプションを確認中...</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8F0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2D1B00',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 15,
    color: '#8B7355',
    marginTop: 8,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 15,
    color: '#E53935',
    textAlign: 'center',
    marginBottom: 8,
  },
  redirectText: {
    fontSize: 13,
    color: '#8B7355',
  },
});
