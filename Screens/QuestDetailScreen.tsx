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
  if (!quest) return <SafeAreaView style={styles.safe}><View style={styles.missing}><View style={styles.completeMark}><Text style={styles.completeMarkText}>✓</Text></View><Text style={styles.missingTitle}>Quest complete.</Text><Text style={styles.missingText}>The whole crew moved this one across the finish line.</Text><Pressable onPress={onBack} style={styles.missingButton}><Text style={styles.missingButtonText}>Back to active tasks</Text></Pressable></View></SafeAreaView>;
  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}><View style={styles.topbar}><Pressable accessibilityRole="button" accessibilityLabel="Back to active tasks" hitSlop={10} onPress={onBack} style={styles.backButton}><Text style={styles.backGlyph}>‹</Text></Pressable><View style={styles.topIdentity}><Text style={styles.topTitle}>HOMEQUEST</Text><Text style={styles.topSub}>QUEST DETAILS</Text></View><View style={styles.topSpark}><Text style={styles.topSparkText}>✦</Text></View></View><ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
    <View style={styles.heroBack} /><View style={styles.heroMid} /><View style={styles.heroCard}><View style={styles.heroTop}><Text style={styles.eyebrow}>ACTIVE QUEST</Text><Text style={styles.heroMinutes}>{quest.totalEstimatedMinutes} MIN</Text></View><Text style={styles.title}>{quest.title}</Text><Text style={styles.summary}>{quest.summary}</Text><View style={styles.progressCopy}><Text style={styles.progressText}>{quest.completedSubtasks} OF {quest.totalSubtasks} COMPLETE</Text><Text style={styles.percent}>{quest.progress}%</Text></View><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${quest.progress}%` }]} /></View></View>
    <View style={styles.sectionHead}><View><Text style={styles.sectionKicker}>YOUR PART</Text><Text style={styles.section}>Choose a subtask</Text></View><View style={styles.taskCount}><Text style={styles.taskCountText}>{String(quest.tasks.length).padStart(2, '0')}</Text></View></View>
    {quest.tasks.map((task, index) => <TaskCard key={task.id} task={task} index={index} user={user} now={now} busy={busyId === task.id} onClaim={() => claim(task)} onComplete={() => complete(task)} onStartDrive={acceptedAt => onStartDrive(task, acceptedAt)} />)}
    {!!error && <Text style={styles.error}>{error}</Text>}<View style={styles.bottomSpace} />
  </ScrollView></SafeAreaView>;
}

function TaskCard({ task, index, user, now, busy, onClaim, onComplete, onStartDrive }: { task: QuestSubtask; index: number; user: User; now: number; busy: boolean; onClaim: () => void; onComplete: () => void; onStartDrive: (acceptedAt: string) => void }) {
  const mine = task.contributors.find(member => member.id === user.id);
  const eligible = task.skill === 'anyone' || user.roles.includes(task.skill);
  const taken = task.status === 'accepted' && !task.doTogether && !mine;
  const tones = [theme.colors.white, theme.colors.peach, theme.colors.blue, theme.colors.lavender];
  return <OffsetCard style={styles.taskWrap} contentStyle={[styles.taskCard, { backgroundColor: tones[index % tones.length] }]} radius={20} offset={4} shadowColor={index % 2 ? theme.colors.mint : theme.colors.lavender}>
    <View style={styles.taskTop}><View style={styles.numberBox}><Text style={styles.number}>{String(index + 1).padStart(2, '0')}</Text></View><View style={[styles.skill, task.skill === 'driver' && styles.driveSkill]}><Text style={styles.skillText}>{task.skill.toUpperCase()}</Text></View></View>
    <Text style={styles.taskTitle}>{task.title}</Text><Text style={styles.description}>{task.description}</Text>
    {!!task.destination && <Text style={styles.destination}>⌖ {task.destination}</Text>}
    {!!task.contributors.length && <Text style={styles.contributors}>Crew: {task.contributors.map(member => member.name).join(', ')}</Text>}
    {task.status === 'completed' ? <View style={styles.done}><Text style={styles.doneText}>✓ COMPLETE</Text></View> : mine ? <><View style={styles.timerRow}><Text style={styles.timerLabel}>TIME ACTIVE</Text><Text style={styles.timer}>{elapsed(mine.acceptedAt, now)}</Text></View><Pressable disabled={busy} onPress={task.skill === 'driver' ? () => onStartDrive(mine.acceptedAt) : onComplete} style={styles.action}><Text style={styles.actionText}>{task.skill === 'driver' ? 'Open live map' : 'Mark complete'}</Text><View style={styles.actionArrowWrap}><Text style={styles.actionArrow}>→</Text></View></Pressable></> : <Pressable disabled={!eligible || taken || busy} onPress={onClaim} style={[styles.action, (!eligible || taken) && styles.disabled]}>{busy ? <ActivityIndicator color="white" /> : <><Text style={styles.actionText}>{!eligible ? `Requires ${task.skill} badge` : taken ? `Taken by ${task.contributors[0]?.name}` : task.skill === 'driver' ? 'Start drive task' : 'Choose this task'}</Text><View style={styles.actionArrowWrap}><Text style={styles.actionArrow}>→</Text></View></>}</Pressable>}
  </OffsetCard>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.paper }, loader: { flex: 1 },
  topbar: { minHeight: 70, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border }, backButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border }, backGlyph: { color: theme.colors.ink, fontSize: 29, lineHeight: 31 }, topIdentity: { flex: 1 }, topTitle: { color: theme.colors.ink, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 }, topSub: { color: theme.colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1, marginTop: 2 }, topSpark: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.lavender }, topSparkText: { color: theme.colors.ink, fontSize: 17 },
  page: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: 18 }, heroBack: { position: 'absolute', top: 29, left: 28, right: 28, height: 240, borderRadius: 25, backgroundColor: theme.colors.peach, transform: [{ rotate: '-1.2deg' }] }, heroMid: { position: 'absolute', top: 23, left: 24, right: 24, height: 240, borderRadius: 25, backgroundColor: theme.colors.lavender, transform: [{ rotate: '.8deg' }] }, heroCard: { minHeight: 240, padding: 21, borderRadius: 24, backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border }, heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, eyebrow: { color: theme.colors.brand, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 }, heroMinutes: { color: theme.colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: .8 }, title: { marginTop: 16, color: theme.colors.ink, fontSize: 33, lineHeight: 36, fontWeight: '900', letterSpacing: -1.4 }, summary: { marginTop: 8, color: theme.colors.muted, fontSize: 13, lineHeight: 20 },
  progressCopy: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 23, marginBottom: 8 }, progressText: { color: theme.colors.muted, fontSize: 8.5, fontWeight: '900', letterSpacing: .8 }, percent: { color: theme.colors.orange, fontSize: 12, fontWeight: '900' }, progressTrack: { height: 9, borderRadius: 5, backgroundColor: 'rgba(21,40,32,.1)', overflow: 'hidden' }, progressFill: { height: '100%', minWidth: 3, borderRadius: 5, backgroundColor: theme.colors.orange },
  sectionHead: { marginTop: 35, marginBottom: 13, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }, sectionKicker: { color: theme.colors.brand, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 }, section: { color: theme.colors.ink, fontSize: 23, lineHeight: 28, fontWeight: '900', letterSpacing: -.7, marginTop: 2 }, taskCount: { width: 35, height: 35, borderRadius: 12, backgroundColor: theme.colors.ink, alignItems: 'center', justifyContent: 'center' }, taskCountText: { color: theme.colors.lime, fontSize: 10, fontWeight: '900' },
  taskWrap: { marginBottom: 15 }, taskCard: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 20, padding: 17 }, taskTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, numberBox: { minWidth: 34, height: 27, borderRadius: 10, backgroundColor: theme.colors.brand, alignItems: 'center', justifyContent: 'center' }, number: { color: theme.colors.white, fontSize: 9, fontWeight: '900' }, skill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99, backgroundColor: theme.colors.lime }, driveSkill: { backgroundColor: theme.colors.blue }, skillText: { color: theme.colors.ink, fontSize: 8, fontWeight: '900', letterSpacing: .7 }, taskTitle: { marginTop: 14, color: theme.colors.ink, fontSize: 20, lineHeight: 24, fontWeight: '900', letterSpacing: -.3 }, description: { marginTop: 5, color: theme.colors.muted, fontSize: 12, lineHeight: 18 }, destination: { marginTop: 11, color: theme.colors.ink, fontSize: 11, fontWeight: '800' }, contributors: { marginTop: 12, color: theme.colors.muted, fontSize: 10, fontWeight: '700' },
  timerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 15, paddingTop: 13, borderTopWidth: 1, borderTopColor: theme.colors.border }, timerLabel: { color: theme.colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: .8 }, timer: { color: theme.colors.orange, fontSize: 15, fontWeight: '900', fontVariant: ['tabular-nums'] }, action: { minHeight: 50, marginTop: 13, borderRadius: 16, paddingLeft: 16, paddingRight: 7, backgroundColor: theme.colors.brand, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, actionText: { flex: 1, color: theme.colors.white, fontSize: 11, fontWeight: '900' }, actionArrowWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: theme.colors.lime, alignItems: 'center', justifyContent: 'center' }, actionArrow: { color: theme.colors.ink, fontSize: 18 }, disabled: { opacity: .38 }, done: { marginTop: 14, borderRadius: 13, padding: 12, backgroundColor: theme.colors.mint, alignItems: 'center' }, doneText: { color: theme.colors.ink, fontSize: 10, fontWeight: '900', letterSpacing: 1 }, error: { color: theme.colors.error, fontWeight: '800', textAlign: 'center', marginTop: 10 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }, completeMark: { width: 64, height: 64, borderRadius: 22, backgroundColor: theme.colors.mint, alignItems: 'center', justifyContent: 'center' }, completeMarkText: { color: theme.colors.brand, fontSize: 28, fontWeight: '900' }, missingTitle: { marginTop: 17, color: theme.colors.ink, fontSize: 29, fontWeight: '900' }, missingText: { maxWidth: 280, marginTop: 7, color: theme.colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center' }, missingButton: { marginTop: 20, borderRadius: 15, paddingHorizontal: 18, paddingVertical: 13, backgroundColor: theme.colors.brand }, missingButtonText: { color: theme.colors.white, fontSize: 11, fontWeight: '900' }, bottomSpace: { height: 30 },
});
