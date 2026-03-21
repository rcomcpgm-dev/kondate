import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSubscriptionStore } from '../src/stores/subscriptionStore';

export default function RootLayout() {
  const checkStatus = useSubscriptionStore((s) => s.checkStatus);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FFF8F0' },
          animation: 'slide_from_right',
        }}
      />
    </>
  );
}
