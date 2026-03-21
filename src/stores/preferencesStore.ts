import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DislikedIngredient } from '../types';

interface PreferencesState {
  dislikedIngredients: DislikedIngredient[];
  addDisliked: (name: string) => void;
  removeDisliked: (name: string) => void;
  isDisliked: (name: string) => boolean;
  getDislikedNames: () => string[];
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      dislikedIngredients: [],

      addDisliked: (name: string) => {
        const current = get().dislikedIngredients;
        if (current.some((d) => d.name === name)) return;
        set({
          dislikedIngredients: [
            ...current,
            { name, addedAt: new Date().toISOString() },
          ],
        });
      },

      removeDisliked: (name: string) => {
        set({
          dislikedIngredients: get().dislikedIngredients.filter(
            (d) => d.name !== name,
          ),
        });
      },

      isDisliked: (name: string) => {
        return get().dislikedIngredients.some((d) => d.name === name);
      },

      getDislikedNames: () => {
        return get().dislikedIngredients.map((d) => d.name);
      },
    }),
    {
      name: 'kondate-preferences',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
