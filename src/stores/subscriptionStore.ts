import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SubscriptionTier } from '../types';

interface SubscriptionState {
  tier: SubscriptionTier;
  expiresAt: string | null;
  dailyGachaCount: number;
  lastGachaDate: string | null;
  firstUseDate: string | null;

  isPremium: () => boolean;
  getDailyLimit: () => number;
  getRemaining: () => number;
  canUseGacha: () => boolean;
  incrementGacha: () => void;
  purchase: () => Promise<void>;
  restore: () => Promise<void>;
  checkStatus: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      tier: 'free',
      expiresAt: null,
      dailyGachaCount: 0,
      lastGachaDate: null,
      firstUseDate: null,

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
        const { dailyGachaCount, lastGachaDate } = get();
        const used = lastGachaDate === today ? dailyGachaCount : 0;
        return Math.max(0, limit - used);
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

      // TODO: Implement real IAP with expo-in-app-purchases
      purchase: async () => {
        const expires = new Date();
        expires.setDate(expires.getDate() + 30);
        set({
          tier: 'premium',
          expiresAt: expires.toISOString(),
        });
      },

      restore: async () => {
        // TODO: Implement real restore from App Store
      },

      checkStatus: () => {
        const { tier, expiresAt } = get();
        if (tier === 'premium' && expiresAt && new Date(expiresAt) <= new Date()) {
          set({ tier: 'free', expiresAt: null });
        }
      },
    }),
    {
      name: 'kondate-subscription',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
