import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { getActiveQuests, getBadges } from '../services/database';
import type { ActiveQuest, EarnedBadge, Family, FamilyMember, User } from '../types';
import { theme } from '../theme';
import { OffsetCard } from '../components/OffsetCard';

const avatarColors = [theme.colors.mint, theme.colors.blue, theme.colors.peach, theme.colors.lavender];

export function DashboardScreen({ user, family, refreshToken, onHome, onOpenQuest, onLogout }: {
  user: User;
  family: Family;
  refreshToken: number;
  onHome: () => void;
  onOpenQuest: (questId: number) => void;
  onLogout: () => Promise<void>;
}) {
  const db = useSQLiteContext();
  const [quests, setQuests] = useState<ActiveQuest[]>([]);
  const [badges, setBadges] = useState<EarnedBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [active, earned] = await Promise.all([getActiveQuests(db, family.id), getBadges(db, user.id)]);
    setQuests(active);
    setBadges(earned);
    setLoading(false);
  }, [db, family.id, user.id]);

  useEffect(() => { load().catch(() => setLoading(false)); }, [load, refreshToken]);
  const refresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={theme.colors.orange} />}
      >
        <View style={styles.topbar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to home" hitSlop={10} onPress={onHome} style={styles.brandLockup}><View style={styles.logo}><Text style={styles.logoText}>HQ</Text></View><View><Text style={styles.brand}>HOMEQUEST</Text><Text style={styles.homeHint}>BACK HOME</Text></View></Pressable>
          <Pressable hitSlop={10} onPress={onLogout}><Text style={styles.logout}>Log out</Text></Pressable>
        </View>

        <View style={styles.welcome}><View style={styles.welcomeOrb} /><View style={styles.welcomeDash} />
          <Text style={styles.eyebrow}>{family.name.toUpperCase()} · CREW BOARD</Text>
          <Text style={styles.title}>Everything your family has <Text style={styles.orange}>in motion.</Text></Text>
          <Text style={styles.subtitle}>{quests.length ? `Pick a quest, choose your part, and move it forward together.` : `Ready when you are, ${user.name.split(' ')[0]}.`}</Text>
          <View style={styles.stats}><View><Text style={styles.statValue}>{String(quests.length).padStart(2, '0')}</Text><Text style={styles.statLabel}>ACTIVE QUESTS</Text></View><View style={styles.statRule} /><View><Text style={styles.statValue}>{badges.filter(badge => badge.earned).length}</Text><Text style={styles.statLabel}>BADGES EARNED</Text></View></View>
        </View>

        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>ACTIVE TASKS</Text><Text style={styles.sectionCount}>{String(quests.length).padStart(2, '0')}</Text></View>
        {loading ? <ActivityIndicator style={styles.loader} color={theme.colors.orange} /> : quests.length ? quests.map((quest, index) => <QuestCard key={quest.id} quest={quest} index={index} onPress={() => onOpenQuest(quest.id)} />) : <View style={styles.empty}><View style={styles.emptyIcon}><Text style={styles.emptyIconText}>↗</Text></View><Text style={styles.emptyTitle}>No active quests yet</Text><Text style={styles.emptyText}>Head home and open the AI Subtask Builder to create the first family quest.</Text><Pressable onPress={onHome} style={styles.emptyHome}><Text style={styles.emptyHomeText}>Back to home</Text></Pressable></View>}

        <View style={[styles.sectionHeading, styles.badgeHeading]}><Text style={styles.sectionTitle}>YOUR BADGES</Text><Text style={styles.sectionHint}>More soon</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeRow}>
          {badges.map(badge => <BadgeCard key={badge.id} badge={badge} />)}
        </ScrollView>
        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Avatar({ member, index = 0, small = false }: { member: FamilyMember; index?: number; small?: boolean }) {
  return <View style={[styles.avatar, small && styles.avatarSmall, { backgroundColor: avatarColors[index % avatarColors.length] }]}><Text style={[styles.avatarText, small && styles.avatarTextSmall]}>{member.name.charAt(0).toUpperCase()}</Text></View>;
}

function QuestCard({ quest, index, onPress }: { quest: ActiveQuest; index: number; onPress: () => void }) {
  const tones = [theme.colors.white, theme.colors.mint, theme.colors.peach, theme.colors.blue];
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open ${quest.title}`}>
    <OffsetCard style={styles.questCardWrap} contentStyle={[styles.questCard, { backgroundColor: tones[index % tones.length] }]} radius={22} shadowColor={index % 2 ? theme.colors.lavender : theme.colors.peach}>
      <View style={styles.questTop}><View style={styles.activePill}><View style={styles.activeDot} /><Text style={styles.activeText}>ACTIVE</Text></View><Text style={styles.minutes}>{quest.totalEstimatedMinutes} MIN</Text></View>
      <Text style={styles.questTitle}>{quest.title}</Text>
      {!!quest.summary && <Text numberOfLines={2} style={styles.questSummary}>{quest.summary}</Text>}
      <View style={styles.peopleRow}>
        <View style={styles.personBlock}><Text style={styles.metaLabel}>CREATED BY</Text><View style={styles.person}><Avatar member={quest.creator} /><Text numberOfLines={1} style={styles.personName}>{quest.creator.name}</Text></View></View>
        <View style={styles.contributorBlock}><Text style={styles.metaLabel}>CONTRIBUTORS</Text>{quest.contributors.length ? <View style={styles.avatarStack}>{quest.contributors.slice(0, 4).map((member, index) => <View key={member.id} style={index ? styles.avatarOverlap : undefined}><Avatar member={member} index={index + 1} small /></View>)}{quest.contributors.length > 4 && <Text style={styles.more}>+{quest.contributors.length - 4}</Text>}</View> : <Text style={styles.openText}>Open to join</Text>}</View>
      </View>
      <View style={styles.progressCopy}><Text style={styles.progressLabel}>PROGRESS</Text><Text style={styles.progressValue}>{quest.completedSubtasks}/{quest.totalSubtasks} · {quest.progress}%</Text></View>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${quest.progress}%` }]} /></View><View style={styles.openQuest}><Text style={styles.openQuestText}>Open quest</Text><View style={styles.openArrow}><Text style={styles.openArrowText}>↗</Text></View></View>
    </OffsetCard>
    </Pressable>
  );
}

function BadgeCard({ badge }: { badge: EarnedBadge }) {
  return <View style={[styles.badgeCard, !badge.earned && styles.badgeLocked]}><View style={[styles.badgeIcon, badge.earned && styles.badgeIconEarned]}><Text style={styles.badgeIconText}>{badge.icon}</Text></View><Text style={styles.badgeTitle}>{badge.title}</Text><Text style={styles.badgeDescription}>{badge.description}</Text><Text style={styles.badgeProgress}>{badge.earned ? 'EARNED' : `${badge.progress}/${badge.target}`}</Text></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.paper },
  page: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: 18, paddingBottom: 32 },
  topbar: { minHeight: 62, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logo: { width: 34, height: 34, borderRadius: 17, backgroundColor: theme.colors.ink, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-8deg' }] },
  logoText: { color: theme.colors.lime, fontSize: 12, fontWeight: '900' },
  brand: { color: theme.colors.ink, fontSize: 17, fontWeight: '900', letterSpacing: 1.5 },
  homeHint: { color: theme.colors.muted, fontSize: 7, fontWeight: '900', letterSpacing: 1.1, marginTop: 1 },
  logout: { color: theme.colors.ink, fontSize: 12, fontWeight: '800' },
  welcome: { position: 'relative', overflow: 'hidden', marginTop: 18, marginBottom: 28, padding: 21, borderRadius: 25, backgroundColor: theme.colors.ink }, welcomeOrb: { position: 'absolute', right: -45, top: -52, width: 160, height: 160, borderRadius: 80, backgroundColor: theme.colors.lavender, opacity: .9 }, welcomeDash: { position: 'absolute', right: 22, bottom: 33, width: 66, height: 14, borderRadius: 7, backgroundColor: theme.colors.lime, transform: [{ rotate: '-14deg' }] },
  eyebrow: { alignSelf: 'flex-start', color: theme.colors.mint, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  title: { maxWidth: 390, marginTop: 14, paddingRight: 25, color: theme.colors.white, fontSize: 33, lineHeight: 36, fontWeight: '900', letterSpacing: -1.4 },
  orange: { color: theme.colors.orange },
  subtitle: { maxWidth: 340, marginTop: 10, color: 'rgba(255,255,255,.64)', fontSize: 12.5, lineHeight: 19 }, stats: { marginTop: 23, flexDirection: 'row', alignItems: 'center', gap: 18 }, statValue: { color: theme.colors.white, fontSize: 20, fontWeight: '900' }, statLabel: { marginTop: 2, color: 'rgba(255,255,255,.52)', fontSize: 7.5, fontWeight: '900', letterSpacing: .8 }, statRule: { width: 1, height: 33, backgroundColor: 'rgba(255,255,255,.16)' },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: theme.colors.ink, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  sectionCount: { color: theme.colors.muted, fontSize: 11, fontWeight: '900' },
  sectionHint: { color: theme.colors.muted, fontSize: 10, fontWeight: '700' },
  loader: { marginVertical: 50 },
  empty: { alignItems: 'center', paddingHorizontal: 30, paddingVertical: 40, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.colors.border, borderRadius: theme.radius.lg },
  emptyIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: theme.colors.lime, alignItems: 'center', justifyContent: 'center' },
  emptyIconText: { fontSize: 22, color: theme.colors.ink },
  emptyTitle: { marginTop: 15, fontSize: 18, fontWeight: '900', color: theme.colors.ink },
  emptyText: { marginTop: 6, color: theme.colors.muted, textAlign: 'center', lineHeight: 20 },
  emptyHome: { marginTop: 17, borderRadius: 13, paddingHorizontal: 18, paddingVertical: 11, backgroundColor: theme.colors.brand },
  emptyHomeText: { color: theme.colors.white, fontSize: 11, fontWeight: '900' },
  questCardWrap: { marginBottom: 14 },
  questCard: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 22, padding: 18 },
  questTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  activePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.colors.lime, borderRadius: 99, paddingHorizontal: 9, paddingVertical: 5 },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.ink },
  activeText: { fontSize: 8, fontWeight: '900', letterSpacing: .8 },
  minutes: { color: theme.colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: .8 },
  questTitle: { marginTop: 15, color: theme.colors.ink, fontSize: 24, lineHeight: 28, fontWeight: '900', letterSpacing: -.8 },
  questSummary: { marginTop: 6, color: theme.colors.muted, fontSize: 13, lineHeight: 19 },
  peopleRow: { flexDirection: 'row', gap: 18, marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.border },
  personBlock: { flex: 1 },
  contributorBlock: { flex: 1, alignItems: 'flex-end' },
  metaLabel: { color: theme.colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: .9, marginBottom: 7 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  personName: { flex: 1, color: theme.colors.ink, fontSize: 11, fontWeight: '800' },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: theme.colors.paper },
  avatarSmall: { width: 28, height: 28, borderRadius: 14 },
  avatarText: { color: theme.colors.ink, fontSize: 12, fontWeight: '900' },
  avatarTextSmall: { fontSize: 10 },
  avatarStack: { flexDirection: 'row', alignItems: 'center' },
  avatarOverlap: { marginLeft: -8 },
  more: { marginLeft: 5, color: theme.colors.muted, fontSize: 10, fontWeight: '800' },
  openText: { color: theme.colors.muted, fontSize: 11, fontStyle: 'italic' },
  progressCopy: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, marginBottom: 7 },
  progressLabel: { color: theme.colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: .9 },
  progressValue: { color: theme.colors.ink, fontSize: 9, fontWeight: '900' },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: 'rgba(21,40,32,.11)', overflow: 'hidden' },
  progressFill: { height: '100%', minWidth: 3, borderRadius: 4, backgroundColor: theme.colors.orange },
  openQuest: { minHeight: 46, marginTop: 16, paddingLeft: 15, paddingRight: 6, borderRadius: 15, backgroundColor: theme.colors.brand, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, openQuestText: { color: theme.colors.white, fontSize: 11, fontWeight: '900' }, openArrow: { width: 34, height: 34, borderRadius: 11, backgroundColor: theme.colors.lime, alignItems: 'center', justifyContent: 'center' }, openArrowText: { color: theme.colors.ink, fontSize: 16 },
  badgeHeading: { marginTop: 35 },
  badgeRow: { gap: 10, paddingRight: 18, paddingBottom: 8 },
  badgeCard: { width: 142, minHeight: 155, borderWidth: 1, borderColor: theme.colors.ink, borderRadius: 17, padding: 14, backgroundColor: theme.colors.lime },
  badgeLocked: { backgroundColor: 'rgba(255,255,255,.4)', borderColor: theme.colors.border },
  badgeIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(21,40,32,.1)', alignItems: 'center', justifyContent: 'center' },
  badgeIconEarned: { backgroundColor: theme.colors.ink },
  badgeIconText: { color: theme.colors.orange, fontSize: 18, fontWeight: '900' },
  badgeTitle: { marginTop: 12, color: theme.colors.ink, fontSize: 13, fontWeight: '900' },
  badgeDescription: { marginTop: 3, color: theme.colors.muted, fontSize: 10, lineHeight: 14 },
  badgeProgress: { marginTop: 'auto', color: theme.colors.ink, fontSize: 9, fontWeight: '900', letterSpacing: .8 },
  bottomSpace: { height: 88 },
  fab: { position: 'absolute', right: 22, bottom: 20, width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.ink, borderWidth: 3, borderColor: theme.colors.lime, shadowColor: '#000', shadowOpacity: .24, shadowOffset: { width: 0, height: 7 }, shadowRadius: 12, elevation: 9 },
  fabPressed: { transform: [{ scale: .95 }] },
  fabText: { color: theme.colors.lime, fontSize: 34, lineHeight: 38, fontWeight: '400' },
});
