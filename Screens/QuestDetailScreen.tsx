import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { OffsetCard } from '../components/OffsetCard';
import { claimSubtask, completeSubtask, getQuestDetails } from '../services/database';
import type { Family, QuestDetails, QuestSubtask, User } from '../types';
import { theme } from '../theme';

const parseDatabaseDate = (value: string) => new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`).getTime();
const elapsed = (startedAt: string, now: number) => {
  const seconds = Math.max(0, Math.floor((now - parseDatabaseDate(startedAt)) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}` : `${minutes}:${String(remainder).padStart(2, '0')}`;
};

export function QuestDetailScreen({ questId, user, family, onBack, onChanged, onStartDrive }: {
  questId: number; user: User; family: Family; onBack: () => void; onChanged: () => void;
  onStartDrive: (task: QuestSubtask, acceptedAt: string) => void;
}) {
  const db = useSQLiteContext();
  const [quest, setQuest] = useState<QuestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const load = useCallback(async () => { setQuest(await getQuestDetails(db, family.id, questId)); setLoading(false); }, [db, family.id, questId]);
  useEffect(() => { load().catch(() => setLoading(false)); }, [load]);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);

  const claim = async (task: QuestSubtask) => {
    setBusyId(task.id); setError('');
    try {
      const acceptedAt = await claimSubtask(db, family.id, task.id, user.id);
      onChanged();
      if (task.skill === 'driver') onStartDrive(task, acceptedAt);
      else await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not claim this task.'); }
    finally { setBusyId(null); }
  };
  const complete = async (task: QuestSubtask) => {
    setBusyId(task.id); setError('');
    try {
      await completeSubtask(db, task.id, user.id); onChanged();
      const updated = await getQuestDetails(db, family.id, questId);
      if (!updated) onBack(); else setQuest(updated);
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not complete this task.'); }
    finally { setBusyId(null); }
  };

  if (loading) return <SafeAreaView style={styles.safe}><ActivityIndicator style={styles.loader} color={theme.colors.orange} /></SafeAreaView>;
  if (!quest) return <SafeAreaView style={styles.safe}><View style={styles.missing}><Text style={styles.title}>Quest complete.</Text><Pressable onPress={onBack}><Text style={styles.back}>← Back to dashboard</Text></Pressable></View></SafeAreaView>;
  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}><View style={styles.topbar}><Pressable hitSlop={10} onPress={onBack}><Text style={styles.back}>← Dashboard</Text></Pressable><Text style={styles.topTitle}>QUEST DETAILS</Text><View style={styles.spacer} /></View><ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
    <Text style={styles.eyebrow}>ACTIVE QUEST</Text><Text style={styles.title}>{quest.title}</Text><Text style={styles.summary}>{quest.summary}</Text>
    <View style={styles.progressCopy}><Text style={styles.progressText}>{quest.completedSubtasks} OF {quest.totalSubtasks} COMPLETE</Text><Text style={styles.percent}>{quest.progress}%</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${quest.progress}%` }]} /></View>
    <Text style={styles.section}>CHOOSE A SUBTASK</Text>
    {quest.tasks.map((task, index) => <TaskCard key={task.id} task={task} index={index} user={user} now={now} busy={busyId === task.id} onClaim={() => claim(task)} onComplete={() => complete(task)} onStartDrive={acceptedAt => onStartDrive(task, acceptedAt)} />)}
    {!!error && <Text style={styles.error}>{error}</Text>}<View style={styles.bottomSpace} />
  </ScrollView></SafeAreaView>;
}

function TaskCard({ task, index, user, now, busy, onClaim, onComplete, onStartDrive }: { task: QuestSubtask; index: number; user: User; now: number; busy: boolean; onClaim: () => void; onComplete: () => void; onStartDrive: (acceptedAt: string) => void }) {
  const mine = task.contributors.find(member => member.id === user.id);
  const eligible = task.skill === 'anyone' || user.roles.includes(task.skill);
  const taken = task.status === 'accepted' && !task.doTogether && !mine;
  return <OffsetCard style={styles.taskWrap} contentStyle={styles.taskCard} radius={17} offset={4}>
    <View style={styles.taskTop}><Text style={styles.number}>{String(index + 1).padStart(2, '0')}</Text><View style={[styles.skill, task.skill === 'driver' && styles.driveSkill]}><Text style={styles.skillText}>{task.skill.toUpperCase()}</Text></View></View>
    <Text style={styles.taskTitle}>{task.title}</Text><Text style={styles.description}>{task.description}</Text>
    {!!task.destination && <Text style={styles.destination}>⌖ {task.destination}</Text>}
    {!!task.contributors.length && <Text style={styles.contributors}>Crew: {task.contributors.map(member => member.name).join(', ')}</Text>}
    {task.status === 'completed' ? <View style={styles.done}><Text style={styles.doneText}>✓ COMPLETE</Text></View> : mine ? <><View style={styles.timerRow}><Text style={styles.timerLabel}>TIME ACTIVE</Text><Text style={styles.timer}>{elapsed(mine.acceptedAt, now)}</Text></View><Pressable disabled={busy} onPress={task.skill === 'driver' ? () => onStartDrive(mine.acceptedAt) : onComplete} style={styles.action}><Text style={styles.actionText}>{task.skill === 'driver' ? 'Open live map' : 'Mark complete'}</Text><Text style={styles.actionArrow}>→</Text></Pressable></> : <Pressable disabled={!eligible || taken || busy} onPress={onClaim} style={[styles.action, (!eligible || taken) && styles.disabled]}>{busy ? <ActivityIndicator color="white" /> : <><Text style={styles.actionText}>{!eligible ? `Requires ${task.skill} badge` : taken ? `Taken by ${task.contributors[0]?.name}` : task.skill === 'driver' ? 'Start drive task' : 'Choose this task'}</Text><Text style={styles.actionArrow}>→</Text></>}</Pressable>}
  </OffsetCard>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.paper }, loader: { flex: 1 }, topbar: { minHeight: 58, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: 'rgba(250,249,246,.97)' }, back: { color: theme.colors.muted, fontSize: 12, fontWeight: '800' }, topTitle: { color: theme.colors.ink, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, spacer: { width: 64 },
  page: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: 18 }, eyebrow: { alignSelf: 'flex-start', color: theme.colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 1.3 }, title: { marginTop: 7, color: theme.colors.ink, fontSize: 33, lineHeight: 37, fontWeight: '800', letterSpacing: -1.1 }, summary: { marginTop: 8, color: theme.colors.muted, fontSize: 14, lineHeight: 20 },
  progressCopy: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22, marginBottom: 7 }, progressText: { color: theme.colors.muted, fontSize: 9, fontWeight: '800', letterSpacing: .8 }, percent: { color: theme.colors.ink, fontSize: 11, fontWeight: '800' }, progressTrack: { height: 7, borderRadius: 4, backgroundColor: '#EFEDE8', overflow: 'hidden' }, progressFill: { height: '100%', minWidth: 3, backgroundColor: theme.colors.orange }, section: { marginTop: 30, marginBottom: 12, color: theme.colors.ink, fontSize: 18, fontWeight: '800', letterSpacing: -.3 },
  taskWrap: { marginBottom: 13 }, taskCard: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 20, padding: 16, backgroundColor: theme.colors.white }, taskTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, number: { width: 24, height: 24, borderRadius: 12, textAlign: 'center', textAlignVertical: 'center', backgroundColor: '#FFF3BF', color: theme.colors.ink, fontSize: 10, fontWeight: '900' }, skill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 99, backgroundColor: theme.colors.lime }, driveSkill: { backgroundColor: theme.colors.blue }, skillText: { color: theme.colors.ink, fontSize: 8, fontWeight: '900', letterSpacing: .7 }, taskTitle: { marginTop: 12, color: theme.colors.ink, fontSize: 18, lineHeight: 22, fontWeight: '800' }, description: { marginTop: 4, color: theme.colors.muted, fontSize: 12, lineHeight: 18 }, destination: { marginTop: 10, color: theme.colors.ink, fontSize: 11, fontWeight: '700' }, contributors: { marginTop: 12, color: theme.colors.muted, fontSize: 10, fontWeight: '700' },
  timerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border }, timerLabel: { color: theme.colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: .8 }, timer: { color: theme.colors.orange, fontSize: 15, fontWeight: '900', fontVariant: ['tabular-nums'] }, action: { minHeight: 46, marginTop: 12, borderRadius: 23, paddingHorizontal: 16, backgroundColor: theme.colors.orange, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, actionText: { color: theme.colors.white, fontSize: 11, fontWeight: '800' }, actionArrow: { color: theme.colors.white, fontSize: 18 }, disabled: { opacity: .38 }, done: { marginTop: 14, borderRadius: 14, padding: 11, backgroundColor: theme.colors.mint, alignItems: 'center' }, doneText: { color: theme.colors.ink, fontSize: 10, fontWeight: '800', letterSpacing: 1 }, error: { color: theme.colors.error, fontWeight: '800', textAlign: 'center', marginTop: 10 }, missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }, bottomSpace: { height: 30 },
});
