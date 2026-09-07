import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { Card } from '../components/Card';

interface HomeScreenProps {
  onNavigateToPlans: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigateToPlans }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good afternoon,</Text>
            <Text style={styles.userName}>The Miller Family</Text>
          </View>
          <View style={styles.avatarRow}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.pastelBlue }]}>
              <Text style={styles.avatarText}>Mom</Text>
            </View>
            <View style={[styles.avatar, { backgroundColor: theme.colors.pastelLavender }]}>
              <Text style={styles.avatarText}>Sam</Text>
            </View>
            <View style={[styles.avatar, { backgroundColor: theme.colors.pastelPeach }]}>
              <Text style={styles.avatarText}>Dad</Text>
            </View>
          </View>
        </View>

        <Card bgColor={theme.colors.surface}>
          <Text style={styles.sectionTitle}>Today’s Flow</Text>
          <View style={styles.flowRow}>
            <View style={styles.flowNode}>
              <Text style={styles.flowTime}>08:15 AM</Text>
              <Text style={styles.flowText}>🚗 School drop-off done</Text>
            </View>
            <View style={styles.flowNode}>
              <Text style={styles.flowTime}>05:30 PM</Text>
              <Text style={styles.flowText}>🏀 Practice pickup needed</Text>
            </View>
          </View>
        </Card>

        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.pastelPeach }]}>
            <Text style={styles.actionIcon}>✋</Text>
            <Text style={styles.actionText}>Need Help</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.colors.pastelMint }]}>
            <Text style={styles.actionIcon}>🤝</Text>
            <Text style={styles.actionText}>Can Help</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeading}>Categories</Text>
        <View style={styles.grid}>
          <TouchableOpacity style={[styles.gridItem, { backgroundColor: theme.colors.pastelBlue }]}>
            <Text style={styles.gridIcon}>🚗</Text>
            <Text style={styles.gridText}>Transport</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.gridItem, { backgroundColor: theme.colors.pastelLavender }]}>
            <Text style={styles.gridIcon}>📚</Text>
            <Text style={styles.gridText}>School</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.gridItem, { backgroundColor: theme.colors.pastelPeach }]}>
            <Text style={styles.gridIcon}>🍲</Text>
            <Text style={styles.gridText}>Meals</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.gridItem, { backgroundColor: theme.colors.pastelMint }]}
            onPress={onNavigateToPlans}
          >
            <Text style={styles.gridIcon}>📅</Text>
            <Text style={styles.gridText}>Plans</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionHeading}>Active Requests</Text>
        <Card bgColor={theme.colors.pastelBlue}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTag}>TRANSPORT</Text>
            <Text style={styles.cardTime}>5:30 PM Today</Text>
          </View>
          <Text style={styles.cardTitle}>Pickup from Basketball Practice</Text>
          <Text style={styles.cardSub}>Sam requested • Pickup at Main Gym</Text>
        </Card>

        <Card bgColor={theme.colors.pastelPeach}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTag}>MEAL</Text>
            <Text style={styles.cardTime}>7:00 PM Today</Text>
          </View>
          <Text style={styles.cardTitle}>Taco Tuesday Night</Text>
          <Text style={styles.cardSub}>Dad cooking • Open for prep offers</Text>
        </Card>

        <Card bgColor={theme.colors.accentYellow}>
          <Text style={styles.perspectiveTitle}>💡 Shared Perspective</Text>
          <Text style={styles.perspectiveText}>
            "Teenagers and parents both balance packed schedules. Small offers of help build big trust."
          </Text>
        </Card>
      </ScrollView>

      <View style={styles.navBar}>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>🏠</Text>
          <Text style={[styles.navLabel, styles.navActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={onNavigateToPlans}>
          <Text style={styles.navIcon}>📅</Text>
          <Text style={styles.navLabel}>Plans</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={styles.navLabel}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    padding: theme.spacing.md,
    paddingBottom: 90,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  greeting: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  avatarRow: {
    flexDirection: 'row',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  flowRow: {
    gap: 8,
  },
  flowNode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flowTime: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  flowText: {
    fontSize: 13,
    color: theme.colors.textPrimary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginVertical: theme.spacing.xs,
  },
  actionBtn: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  gridIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  gridText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardTag: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  cardTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  cardSub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  perspectiveTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  perspectiveText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.white,
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 18,
  },
  navLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  navActive: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
});
