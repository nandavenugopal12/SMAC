import React, { type PropsWithChildren } from 'react';
import {
  StyleSheet,
  View,
  type ColorValue,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type OffsetCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  shadowColor?: ColorValue;
  offset?: number;
  radius?: number;
}>;

export function OffsetCard({
  children,
  style,
  contentStyle,
  shadowColor = '#000000',
  offset = 5,
  radius = 22,
}: OffsetCardProps) {
  return (
    <View style={[styles.wrapper, { shadowColor, shadowOffset: { width: 0, height: offset } }, style]}>
      <View style={[styles.content, { borderRadius: radius }, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { shadowOpacity: 0.08, shadowRadius: 10, elevation: 2 },
  content: {
    backgroundColor: '#FFFFFF',
  },
});
