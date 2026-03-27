import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, Linking } from 'react-native';
import type { SubscriptionTier } from '../types';
import {
  createCheckoutSession,
  getSubscriptionStatus,
  createPortalSession,
} from '../lib/subscriptionApi';

interface SubscriptionState {
  tier: SubscriptionTier;
  expiresAt: string | null;
  token: string | null;
  customerId: string | null;
  dailyGachaCount: number;
  lastGachaDate: string | null;
  firstUseDate: string | null;
  rewardBonusCount: number;
  lastRewardDate: string | null;

  isPremium: () => boolean;
  getDailyLimit: () => number;
  getRemaining: () => number;
  canUseGacha: () => boolean;
  incrementGacha: () => void;
  canWatchRewardAd: () => boolean;
  addRewardBonus: () => void;
  purchase: () => Promise<void>;
  restore: () => Promise<void>;
  openPortal: () => Promise<void>;
  activateFromCheckout: (token: string, expiresAt: string, customerId: string) => void;
  refreshStatus: () => Promise<void>;
  checkStatus: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      tier: 'free',
      expiresAt: null,
      token: null,
      customerId: null,
      dailyGachaCount: 0,
      lastGachaDate: null,
      firstUseDate: null,
      rewardBonusCount: 0,
      lastRewardDate: null,

      isPremium: () => {
        const { tier, expiresAt } = get();
        if (tier !== 'premium') return false;
        if (!expiresAt) return false;
        return new Date(expiresAt) > new Date();
      },

      getDailyLimit: () => {
        if (get().isPremium()) return Infinity;
        const { firstUseDate } = get();
        if (!firstUseDate) return 10;
        const daysSinceFirst = Math.floor(
          (Date.now() - new Date(firstUseDate).getTime()) / (1000 * 60 * 60 * 24),
        );
        if (daysSinceFirst <= 0) return 10;  // Day 1: 10 tries
        if (daysSinceFirst <= 2) return 5;   // Day 2-3: 5 tries
        return 5;                             // Day 4+: 5 tries
      },

      getRemaining: () => {
        if (get().isPremium()) return Infinity;
        const limit = get().getDailyLimit();
        const today = new Date().toISOString().slice(0, 10);
        const { dailyGachaCount, lastGachaDate, rewardBonusCount, lastRewardDate } = get();
        const used = lastGachaDate === today ? dailyGachaCount : 0;
        const bonus = lastRewardDate === today ? rewardBonusCount : 0;
        return Math.max(0, limit + bonus - used);
      },

      canUseGacha: () => {
        if (get().isPremium()) return true;
        return get().getRemaining() > 0;
      },

      incrementGacha: () => {
        const today = new Date().toISOString().slice(0, 10);
        const { lastGachaDate, dailyGachaCount, firstUseDate } = get();
        const updates: Partial<SubscriptionState> = {};
        if (!firstUseDate) {
          updates.firstUseDate = new Date().toISOString();
        }
        if (lastGachaDate !== today) {
          updates.dailyGachaCount = 1;
          updates.lastGachaDate = today;
        } else {
          updates.dailyGachaCount = dailyGachaCount + 1;
        }
        set(updates as SubscriptionState);
      },

      canWatchRewardAd: () => {
        if (get().isPremium()) return false;
        const today = new Date().toISOString().slice(0, 10);
        const { rewardBonusCount, lastRewardDate } = get();
        const todayBonus = lastRewardDate === today ? rewardBonusCount : 0;
        return todayBonus < 3; // Max 3 reward ads per day
      },

      addRewardBonus: () => {
        const today = new Date().toISOString().slice(0, 10);
        const { rewardBonusCount, lastRewardDate } = get();
        if (lastRewardDate !== today) {
          set({ rewardBonusCount: 1, lastRewardDate: today });
        } else {
          set({ rewardBonusCount: rewardBonusCount + 1 });
        }
      },

      purchase: async () => {
        if (Platform.OS === 'web') {
          const { url } = await createCheckoutSession();
          window.location.href = url;
        } else {
          // Mobile: open checkout URL in browser
          const { url } = await createCheckoutSession();
          await Linking.openURL(url);
        }
      },

      restore: async () => {
        const { customerId } = get();
        if (!customerId) return;
        await get().refreshStatus();
      },

      openPortal: async () => {
        const { customerId } = get();
        if (!customerId) return;
        const { url } = await createPortalSession(customerId);
        if (Platform.OS === 'web') {
          window.location.href = url;
        } else {
          await Linking.openURL(url);
        }
      },

      activateFromCheckout: (token: string, expiresAt: string, customerId: string) => {
        set({
          tier: 'premium',
          token,
          expiresAt,
          customerId,
        });
      },

      refreshStatus: async () => {
        const { customerId } = get();
        if (!customerId) return;
        try {
          const status = await getSubscriptionStatus({ customerId });
          if (status.tier === 'premium' && status.token) {
            set({
              tier: 'premium',
              token: status.token,
              expiresAt: status.expiresAt || null,
            });
          } else {
            set({ tier: 'free', token: null, expiresAt: null });
          }
        } catch {
          // Silently fail — keep existing state
        }
      },

      checkStatus: () => {
        const { tier, expiresAt } = get();
        if (tier === 'premium' && expiresAt && new Date(expiresAt) <= new Date()) {
          // Token expired — try refreshing from Stripe
          get().refreshStatus();
        }
      },
    }),
    {
      name: 'kondate-subscription',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
