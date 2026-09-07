import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { theme } from '../theme';

export const IllustrationRoad: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={[styles.path, styles.leftPath]}>
        <Text style={styles.icon}>🏠</Text>
      </View>
      <View style={styles.centerNode}>
        <Text style={styles.nodeText}>🤝</Text>
      </View>
      <View style={[styles.path, styles.rightPath]}>
        <Text style={styles.icon}>🎓</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 140,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: theme.spacing.lg,
  },
  path: {
    flex: 1,
    height: 60,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftPath: {
    backgroundColor: theme.colors.pastelBlue,
    marginRight: -10,
  },
  rightPath: {
    backgroundColor: theme.colors.pastelPeach,
    marginLeft: -10,
  },
  centerNode: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.pastelLavender,
    borderWidth: 4,
    borderColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  icon: {
    fontSize: 24,
  },
  nodeText: {
    fontSize: 28,
  },
});
