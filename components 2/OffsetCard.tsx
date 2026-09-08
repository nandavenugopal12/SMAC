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
  shadowColor = '#152820',
  offset = 5,
  radius = 22,
}: OffsetCardProps) {
  return (
    <View style={style}>
      <View
        pointerEvents="none"
        style={[
          styles.fill,
          styles.shadowPlate,
          {
            backgroundColor: shadowColor,
            borderRadius: radius,
            transform: [{ translateX: offset }, { translateY: offset }],
          },
        ]}
      />
      <View style={[styles.content, { borderRadius: radius }, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  shadowPlate: {
    borderWidth: 1,
    borderColor: '#152820',
  },
  content: {
    backgroundColor: '#FFFFFF',
  },
});
