import type { Rarity } from '../types';

export interface RarityConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  stars: number;
  emoji: string;
}

export const RARITY_CONFIG: Record<Rarity, RarityConfig> = {
  N: {
    label: 'ノーマル',
    color: '#8B7355',
    bgColor: '#F5F0E8',
    borderColor: '#D4C5B5',
    glowColor: '#D4C5B5',
    stars: 1,
    emoji: '⚪',
  },
  R: {
    label: 'レア',
    color: '#1976D2',
    bgColor: '#E3F2FD',
    borderColor: '#64B5F6',
    glowColor: '#42A5F5',
    stars: 2,
    emoji: '🔵',
  },
  SR: {
    label: 'スーパーレア',
    color: '#F9A825',
    bgColor: '#FFF8E1',
    borderColor: '#FFD54F',
    glowColor: '#FFCA28',
    stars: 3,
    emoji: '🟡',
  },
  SSR: {
    label: '超激レア',
    color: '#E040FB',
    bgColor: '#F3E5F5',
    borderColor: '#CE93D8',
    glowColor: '#AB47BC',
    stars: 4,
    emoji: '🌈',
  },
};

// Weighted rarity selection
export function rollRarity(): Rarity {
  const roll = Math.random() * 100;
  if (roll < 7) return 'SSR';   // 7%
  if (roll < 25) return 'SR';   // 18%
  if (roll < 55) return 'R';    // 30%
  return 'N';                    // 45%
}

export function rarityStars(rarity: Rarity): string {
  return '★'.repeat(RARITY_CONFIG[rarity].stars) +
    '☆'.repeat(4 - RARITY_CONFIG[rarity].stars);
}
