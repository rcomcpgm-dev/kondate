import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MealPlan, DecidedMeal } from '../types';

const MAX_HISTORY = 100;

interface HistoryState {
  decidedMeals: DecidedMeal[];
  addDecision: (mealPlan: MealPlan) => void;
  getRecentDecisions: (days: number) => DecidedMeal[];
  clearHistory: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      decidedMeals: [],

      addDecision: (mealPlan: MealPlan) => {
        const entry: DecidedMeal = {
          mealPlan,
          decidedAt: new Date().toISOString(),
        };
        set({
          decidedMeals: [entry, ...get().decidedMeals].slice(0, MAX_HISTORY),
        });
      },

      getRecentDecisions: (days: number) => {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return get().decidedMeals.filter(
          (d) => new Date(d.decidedAt) >= cutoff,
        );
      },

      clearHistory: () => set({ decidedMeals: [] }),
    }),
    {
      name: 'kondate-history',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
