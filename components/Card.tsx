import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

interface CardProps { children: React.ReactNode; style?: ViewStyle; bgColor?: string; onPress?: () => void; }
export const Card: React.FC<CardProps> = ({ children, style, bgColor = theme.colors.surface, onPress }) => {
  const cardStyle = [styles.card, { backgroundColor: bgColor }, style];
  return onPress ? <TouchableOpacity activeOpacity={0.84} onPress={onPress} style={cardStyle}>{children}</TouchableOpacity> : <View style={cardStyle}>{children}</View>;
};
const styles = StyleSheet.create({ card: { borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginBottom: theme.spacing.sm, borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.soft } });
