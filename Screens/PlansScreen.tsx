import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

interface PlansScreenProps {
  onBack: () => void;
}

export const PlansScreen: React.FC<PlansScreenProps> = ({ onBack }) => {
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filters = [
    { label: 'All', icon: '✨' },
    { label: 'Weekend', icon: '⛺' },
    { label: 'Trip', icon: '✈️' },
    { label: 'School', icon: '🎓' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Family Plans</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.sectionHeading}>Family Availability</Text>
        <Card bgColor={theme.colors.surface}>
          <View style={styles.availRow}>
            <View style={styles.availItem}>
              <Text style={styles.availName}>Mom</Text>
              <Text style={styles.availStatus}>🟢 Free after 4 PM</Text>
            </View>
            <View style={styles.availItem}>
              <Text style={styles.availName}>Dad</Text>
              <Text style={styles.availStatus}>🟡 Busy until 6 PM</Text>
            </View>
            <View style={styles.availItem}>
              <Text style={styles.availName}>Sam</Text>
              <Text style={styles.availStatus}>🟢 Free all evening</Text>
            </View>
          </View>
        </Card>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {filters.map((f) => (
            <TouchableOpacity
              key={f.label}
              onPress={() => setSelectedFilter(f.label)}
              style={[
                styles.filterChip,
                selectedFilter === f.label && styles.filterChipActive,
              ]}
            >
              <Text style={styles.chipIcon}>{f.icon}</Text>
              <Text
                style={[
                  styles.chipText,
                  selectedFilter === f.label && styles.chipTextActive,
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Button title="+ Create Family Plan" onPress={() => {}} style={styles.createBtn} />

        <Text style={styles.sectionHeading}>Upcoming Plans</Text>
        <Card bgColor={theme.colors.pastelMint}>
          <View style={styles.planHeader}>
            <Text style={styles.planTag}>WEEKEND</Text>
            <Text style={styles.planDate}>Sat, Sep 12</Text>
          </View>
          <Text style={styles.planTitle}>Lake Hike & Picnic</Text>
          <Text style={styles.planDesc}>Proposed by Sam • Needs snacks & driver</Text>

          <View style={styles.actionRow}>
            <Button title="Accept" onPress={() => {}} style={styles.actionBtnSmall} textStyle={{ fontSize: 12 }} />
            <Button title="Suggest Change" onPress={() => {}} variant="outline" style={styles.actionBtnSmall} textStyle={{ fontSize: 12 }} />
            <Button title="Offer Help" onPress={() => {}} variant="secondary" style={styles.actionBtnSmall} textStyle={{ fontSize: 12 }} />
          </View>
        </Card>

        <Card bgColor={theme.colors.pastelLavender}>
          <View style={styles.planHeader}>
            <Text style={styles.planTag}>FAMILY TRIP</Text>
            <Text style={styles.planDate}>Oct 14 - 18</Text>
          </View>
          <Text style={styles.planTitle}>Fall Mountain Getaway</Text>
          <Text style={styles.planDesc}>Cabin booked • Planning shared activities together</Text>

          <View style={styles.actionRow}>
            <Button title="Accept" onPress={() => {}} style={styles.actionBtnSmall} textStyle={{ fontSize: 12 }} />
            <Button title="Offer Help" onPress={() => {}} variant="secondary" style={styles.actionBtnSmall} textStyle={{ fontSize: 12 }} />
          </View>
        </Card>

        <Card bgColor={theme.colors.pastelPeach}>
          <View style={styles.planHeader}>
            <Text style={styles.planTag}>SCHOOL</Text>
            <Text style={styles.planDate}>Thu, Sep 17</Text>
          </View>
          <Text style={styles.planTitle}>Science Fair Project Review</Text>
          <Text style={styles.planDesc}>Requested by Sam • Brainstorming poster board designs</Text>

          <View style={styles.actionRow}>
            <Button title="Accept" onPress={() => {}} style={styles.actionBtnSmall} textStyle={{ fontSize: 12 }} />
            <Button title="Suggest Change" onPress={() => {}} variant="outline" style={styles.actionBtnSmall} textStyle={{ fontSize: 12 }} />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backBtn: {
    padding: 4,
  },
  backText: {
    fontSize: 15,
    color: theme.colors.pastelBlueDark,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  container: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  availRow: {
    gap: 8,
  },
  availItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  availName: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  availStatus: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  filterScroll: {
    flexDirection: 'row',
    marginVertical: theme.spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: theme.colors.textPrimary,
    borderColor: theme.colors.textPrimary,
  },
  chipIcon: {
    marginRight: 6,
    fontSize: 14,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  chipTextActive: {
    color: theme.colors.white,
  },
  createBtn: {
    marginVertical: theme.spacing.sm,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  planTag: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textSecondary,
  },
  planDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  planDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionBtnSmall: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
});
