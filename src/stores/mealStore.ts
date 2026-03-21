import { create } from 'zustand';
import type { MealSelection, MealPlan, MealTime, Genre, Mood, CookingTime, Servings, GentleOption } from '../types';
import { generateMealPlan } from '../lib/api';
import { generateWithAI } from '../lib/ai';
import { usePreferencesStore } from './preferencesStore';
import { useSubscriptionStore } from './subscriptionStore';
import { useHistoryStore } from './historyStore';

interface MealState {
  selection: MealSelection;
  result: MealPlan | null;
  isGenerating: boolean;

  setMealTime: (mealTime: MealTime) => void;
  setGenre: (genre: Genre) => void;
  toggleMood: (mood: Mood) => void;
  setCookingTime: (cookingTime: CookingTime) => void;
  setServings: (servings: Servings) => void;
  setDietMode: (on: boolean) => void;
  setBeginnerMode: (on: boolean) => void;
  setGentleMode: (on: boolean) => void;
  toggleGentleOption: (option: GentleOption) => void;
  generate: () => Promise<void>;
  clearResult: () => void;
}

export const useMealStore = create<MealState>((set, get) => ({
  selection: {
    mealTime: 'dinner',
    genre: 'random',
    moods: [],
    cookingTime: 'normal',
    servings: 2,
    dietMode: false,
    beginnerMode: false,
    gentleMode: false,
    gentleOptions: [],
  },
  result: null,
  isGenerating: false,

  setMealTime: (mealTime) =>
    set((state) => ({ selection: { ...state.selection, mealTime } })),

  setGenre: (genre) =>
    set((state) => ({ selection: { ...state.selection, genre } })),

  toggleMood: (mood) =>
    set((state) => {
      const moods = state.selection.moods.includes(mood)
        ? state.selection.moods.filter((m) => m !== mood)
        : [...state.selection.moods, mood];
      return { selection: { ...state.selection, moods } };
    }),

  setCookingTime: (cookingTime) =>
    set((state) => ({ selection: { ...state.selection, cookingTime } })),

  setServings: (servings) =>
    set((state) => ({ selection: { ...state.selection, servings } })),

  setDietMode: (dietMode) =>
    set((state) => ({ selection: { ...state.selection, dietMode } })),

  setBeginnerMode: (beginnerMode) =>
    set((state) => ({ selection: { ...state.selection, beginnerMode } })),

  setGentleMode: (gentleMode) =>
    set((state) => ({
      selection: {
        ...state.selection,
        gentleMode,
        gentleOptions: gentleMode ? state.selection.gentleOptions : [],
      },
    })),

  toggleGentleOption: (option) =>
    set((state) => {
      const opts = state.selection.gentleOptions.includes(option)
        ? state.selection.gentleOptions.filter((o) => o !== option)
        : [...state.selection.gentleOptions, option];
      return { selection: { ...state.selection, gentleOptions: opts, gentleMode: opts.length > 0 || state.selection.gentleMode } };
    }),

  generate: async () => {
    set({ isGenerating: true });
    const disliked = usePreferencesStore.getState().getDislikedNames();
    const isPremium = useSubscriptionStore.getState().isPremium();

    try {
      let plan: MealPlan;

      if (isPremium) {
        const recentMeals = useHistoryStore.getState().getRecentDecisions(14);
        try {
          plan = await generateWithAI(get().selection, disliked, recentMeals);
        } catch {
          // Fallback to mock if AI fails
          plan = await generateMealPlan(get().selection, disliked);
        }
      } else {
        plan = await generateMealPlan(get().selection, disliked);
      }

      set({ result: plan, isGenerating: false });
    } catch {
      set({ isGenerating: false });
    }
  },

  clearResult: () => set({ result: null }),
}));
