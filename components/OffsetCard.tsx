import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { theme } from '../theme';

export function OffsetCard({ children, style, contentStyle, offset = 6, radius = 18, shadowColor = theme.colors.ink }: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  offset?: number;
  radius?: number;
  shadowColor?: string;
}) {
  return <View style={[styles.wrap, { paddingBottom: offset, paddingRight: offset }, style]}>
    <View pointerEvents="none" style={[styles.offset, { top: offset, left: offset, borderRadius: radius, backgroundColor: shadowColor }]} />
    <View style={[{ borderRadius: radius }, contentStyle]}>{children}</View>
  </View>;
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  offset: { ...StyleSheet.absoluteFill },
});
