import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Recipe, Rarity } from '../types';

const MAX_FAVORITES = 200;

export interface FavoriteRecipe {
  recipe: Recipe;
  mealType: 'main' | 'side' | 'soup';
  savedAt: string;
}

interface FavoritesState {
  favorites: FavoriteRecipe[];
  addFavorite: (recipe: Recipe, mealType: 'main' | 'side' | 'soup') => boolean;
  removeFavorite: (recipeName: string) => void;
  isFavorite: (recipeName: string) => boolean;
  getFavoritesByRarity: (rarity: Rarity) => FavoriteRecipe[];
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],

      addFavorite: (recipe: Recipe, mealType: 'main' | 'side' | 'soup') => {
        const { favorites } = get();
        if (favorites.length >= MAX_FAVORITES) return false;
        if (favorites.some((f) => f.recipe.name === recipe.name)) return false;
        const entry: FavoriteRecipe = {
          recipe,
          mealType,
          savedAt: new Date().toISOString(),
        };
        set({ favorites: [entry, ...favorites] });
        return true;
      },

      removeFavorite: (recipeName: string) => {
        set({
          favorites: get().favorites.filter((f) => f.recipe.name !== recipeName),
        });
      },

      isFavorite: (recipeName: string) => {
        return get().favorites.some((f) => f.recipe.name === recipeName);
      },

      getFavoritesByRarity: (rarity: Rarity) => {
        return get().favorites.filter((f) => f.recipe.rarity === rarity);
      },
    }),
    {
      name: 'kondate-favorites',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
