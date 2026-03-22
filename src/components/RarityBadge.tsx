import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Rarity } from '../types';

type BadgeSize = 'small' | 'medium' | 'large';

interface RarityBadgeProps {
  rarity: Rarity;
  size?: BadgeSize;
}

const SIZE_CONFIG: Record<BadgeSize, {
  paddingV: number;
  paddingH: number;
  fontSize: number;
  starSize: number;
  borderRadius: number;
  borderWidth: number;
  iconSize: number;
}> = {
  small: {
    paddingV: 3,
    paddingH: 8,
    fontSize: 11,
    starSize: 9,
    borderRadius: 8,
    borderWidth: 1,
    iconSize: 10,
  },
  medium: {
    paddingV: 6,
    paddingH: 14,
    fontSize: 15,
    starSize: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    iconSize: 14,
  },
  large: {
    paddingV: 10,
    paddingH: 20,
    fontSize: 20,
    starSize: 17,
    borderRadius: 18,
    borderWidth: 2,
    iconSize: 18,
  },
};

// Per-rarity visual config
const BADGE_STYLES: Record<Rarity, {
  bg: string;
  bgSecondary: string;   // gradient-like second layer color
  border: string;
  text: string;
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  useGradientEffect: boolean;
  useShimmer: boolean;
}> = {
  N: {
    bg: '#9E9E9E',
    bgSecondary: '#9E9E9E',
    border: '#BDBDBD',
    text: '#FFFFFF',
    shadowColor: '#9E9E9E',
    shadowOpacity: 0,
    shadowRadius: 0,
    useGradientEffect: false,
    useShimmer: false,
  },
  R: {
    bg: '#2196F3',
    bgSecondary: '#1976D2',
    border: '#64B5F6',
    text: '#FFFFFF',
    shadowColor: '#2196F3',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    useGradientEffect: false,
    useShimmer: false,
  },
  SR: {
    bg: '#9C27B0',
    bgSecondary: '#E040FB',
    border: '#CE93D8',
    text: '#FFFFFF',
    shadowColor: '#9C27B0',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    useGradientEffect: true,
    useShimmer: false,
  },
  SSR: {
    bg: '#FFD700',
    bgSecondary: '#FF8C00',
    border: '#FFC107',
    text: '#FFFFFF',
    shadowColor: '#FFD700',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    useGradientEffect: true,
    useShimmer: true,
  },
};

function getStarsDisplay(rarity: Rarity): string {
  const count = { N: 1, R: 2, SR: 3, SSR: 4 }[rarity];
  return '\u2605'.repeat(count);
}

export function RarityBadge({ rarity, size = 'medium' }: RarityBadgeProps) {
  const sizeConfig = SIZE_CONFIG[size];
  const badgeStyle = BADGE_STYLES[rarity];

  const isSSR = rarity === 'SSR';
  const isSR = rarity === 'SR';

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: sizeConfig.borderRadius,
          borderWidth: sizeConfig.borderWidth,
          borderColor: badgeStyle.border,
          shadowColor: badgeStyle.shadowColor,
          shadowOpacity: badgeStyle.shadowOpacity,
          shadowRadius: badgeStyle.shadowRadius,
          shadowOffset: { width: 0, height: 2 },
          elevation: isSSR ? 4 : isSR ? 3 : rarity === 'R' ? 2 : 1,
        },
      ]}
    >
      {/* Base background */}
      <View
        style={[
          styles.bgBase,
          {
            backgroundColor: badgeStyle.bg,
            borderRadius: sizeConfig.borderRadius - 1,
          },
        ]}
      />

      {/* Gradient-like diagonal overlay for SR/SSR */}
      {badgeStyle.useGradientEffect && (
        <View
          style={[
            styles.bgGradientOverlay,
            {
              backgroundColor: badgeStyle.bgSecondary,
              borderRadius: sizeConfig.borderRadius - 1,
            },
          ]}
        />
      )}

      {/* Shimmer highlight bar for SSR */}
      {badgeStyle.useShimmer && (
        <View
          style={[
            styles.shimmerBar,
            { borderRadius: sizeConfig.borderRadius - 1 },
          ]}
        />
      )}

      {/* Inner highlight edge (top) for depth */}
      <View
        style={[
          styles.innerHighlight,
          { borderTopLeftRadius: sizeConfig.borderRadius - 1, borderTopRightRadius: sizeConfig.borderRadius - 1 },
        ]}
      />

      {/* Content */}
      <View
        style={[
          styles.contentRow,
          {
            paddingVertical: sizeConfig.paddingV,
            paddingHorizontal: sizeConfig.paddingH,
          },
        ]}
      >
        {isSSR && (
          <Text style={[styles.starDecoration, { fontSize: sizeConfig.iconSize }]}>
            {'\u2605'}
          </Text>
        )}
        <Text
          style={[
            styles.rarityText,
            {
              fontSize: sizeConfig.fontSize,
              color: badgeStyle.text,
              textShadowColor: isSSR ? 'rgba(0,0,0,0.3)' : isSR ? 'rgba(0,0,0,0.2)' : 'transparent',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: isSSR ? 3 : isSR ? 2 : 0,
            },
          ]}
        >
          {rarity}
        </Text>
        <Text
          style={[
            styles.starsText,
            {
              fontSize: sizeConfig.starSize,
              color: badgeStyle.text,
            },
          ]}
        >
          {getStarsDisplay(rarity)}
        </Text>
        {isSSR && (
          <Text style={[styles.starDecoration, { fontSize: sizeConfig.iconSize }]}>
            {'\u2605'}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  bgBase: {
    ...StyleSheet.absoluteFillObject,
  },
  bgGradientOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: '50%',
    opacity: 0.7,
  },
  shimmerBar: {
    position: 'absolute',
    top: 0,
    left: '20%',
    width: '25%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.25)',
    transform: [{ skewX: '-20deg' }],
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    zIndex: 1,
  },
  rarityText: {
    fontWeight: '900',
    letterSpacing: 1,
  },
  starsText: {
    fontWeight: '700',
  },
  starDecoration: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
