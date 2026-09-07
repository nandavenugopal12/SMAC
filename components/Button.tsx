import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../theme';

interface ButtonProps { title: string; onPress: () => void; variant?: 'primary' | 'secondary' | 'outline' | 'accent'; style?: ViewStyle; textStyle?: TextStyle; }

export const Button: React.FC<ButtonProps> = ({ title, onPress, variant = 'primary', style, textStyle }) => (
  <TouchableOpacity accessibilityRole="button" accessibilityLabel={title} activeOpacity={0.76} onPress={onPress} style={[styles.button, styles[variant], style]}>
    <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  button: { minHeight: 46, paddingVertical: 12, paddingHorizontal: 18, borderRadius: theme.borderRadius.full, alignItems: 'center', justifyContent: 'center' },
  primary: { backgroundColor: theme.colors.textPrimary }, secondary: { backgroundColor: theme.colors.surfaceAlt },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: theme.colors.border }, accent: { backgroundColor: theme.colors.connection },
  text: { fontSize: 14, fontWeight: '700' }, primaryText: { color: theme.colors.white }, secondaryText: { color: theme.colors.textPrimary },
  outlineText: { color: theme.colors.textPrimary }, accentText: { color: theme.colors.connectionDark },
});
