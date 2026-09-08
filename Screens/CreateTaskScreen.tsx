import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { breakDownChore } from '../services/gemini';
import { saveQuest } from '../services/database';
import type { CapabilityRole, Family, QuestPlan, QuestTask, User } from '../types';
import { theme } from '../theme';
import { OffsetCard } from '../components/OffsetCard';

const skillOptions: CapabilityRole[] = ['anyone', 'cook', 'driver', 'adult'];
const examples = ['Clean the kitchen after a big family dinner', 'Do the weekly grocery run and put everything away', 'Get ready and packed for a beach day'];

export function CreateTaskScreen({ user, family, initialChore = '', initialPlan = null, onBack, onCommitted }: {
  user: User;
  family: Family;
  initialChore?: string;
  initialPlan?: QuestPlan | null;
  onBack: () => void;
  onCommitted: () => void;
}) {
  const db = useSQLiteContext();
  const [chore, setChore] = useState(initialChore);
  const [plan, setPlan] = useState<QuestPlan | null>(initialPlan);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (chore.trim().length < 3) return setError('Add a little more detail about the task.');
    setError(''); setGenerating(true);
    try { setPlan(await breakDownChore(chore)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not generate subtasks.'); }
    finally { setGenerating(false); }
  };

  const updateTask = (id: number, patch: Partial<QuestTask>) => setPlan(current => current ? { ...current, tasks: current.tasks.map(task => task.id === id ? { ...task, ...patch } : task) } : current);
  const removeTask = (id: number) => setPlan(current => current ? { ...current, tasks: current.tasks.filter(task => task.id !== id) } : current);
  const addTask = () => setPlan(current => current ? { ...current, tasks: [...current.tasks, { id: -Date.now(), title: 'New subtask', description: '', estimatedMinutes: 10, skill: 'anyone', doTogether: false, destination: '' }] } : current);
  const commit = async () => {
    if (!plan) return;
    if (plan.tasks.some(task => task.skill === 'driver' && !task.destination?.trim())) return setError('Add a destination for every driver task.');
    setError(''); setSaving(true);
    try { await saveQuest(db, family.id, user.id, plan); onCommitted(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not publish this task.'); }
    finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topbar}><Pressable accessibilityRole="button" accessibilityLabel="Back to home" hitSlop={10} onPress={onBack} style={styles.backButton}><Text style={styles.back}>‹</Text></Pressable><View style={styles.topIdentity}><Text style={styles.topTitle}>HOMEQUEST</Text><Text style={styles.topFamily}>{family.name} · AI BUILDER</Text></View><View style={styles.topSpark}><Text style={styles.topSparkText}>✦</Text></View></View>
        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.hero}><View style={styles.heroIcon}><Text style={styles.heroIconText}>✦</Text></View><Text style={styles.eyebrow}>AI SUBTASK BUILDER</Text><Text style={styles.title}>{plan ? 'Shape the plan, then ' : 'What needs to '}<Text style={styles.mintText}>{plan ? 'share it.' : 'get done?'}</Text></Text><Text style={styles.subtitle}>Gemini drafts the steps. You can edit every detail before the family sees anything.</Text><View style={styles.builderPath}><View style={[styles.pathStep, styles.pathActive]}><Text style={styles.pathActiveText}>1 · DESCRIBE</Text></View><View style={[styles.pathStep, plan && styles.pathActive]}><Text style={plan ? styles.pathActiveText : styles.pathText}>2 · REVIEW</Text></View><View style={styles.pathStep}><Text style={styles.pathText}>3 · SHARE</Text></View></View></View>

          {!plan && <OffsetCard contentStyle={styles.composer} radius={24} shadowColor={theme.colors.lavender}>
            <View style={styles.composerTop}><View style={styles.composerMark}><Text style={styles.composerMarkText}>01</Text></View><View><Text style={styles.composerTitle}>Start with the big task</Text><Text style={styles.composerHint}>AI will turn it into clear, useful steps.</Text></View></View>
            <Text style={styles.label}>DESCRIBE THE MAIN TASK</Text>
            <TextInput value={chore} onChangeText={setChore} placeholder="Prepare the house and dinner for Grandma's birthday" placeholderTextColor="rgba(21,40,32,.3)" multiline maxLength={500} style={styles.choreInput} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.examples}>{examples.map((item, index) => <Pressable key={item} onPress={() => setChore(item)} style={styles.example}><Text style={styles.exampleText}>{['Kitchen reset', 'Grocery run', 'Beach prep'][index]}</Text></Pressable>)}</ScrollView>
            <PrimaryButton title="Generate subtasks" busy={generating} onPress={generate} />
          </OffsetCard>}

          {plan && <View>
            <View style={styles.draftHeader}><View><Text style={styles.draftLabel}>DRAFT · NOT PUBLISHED</Text><Text style={styles.draftHint}>Edit anything before committing.</Text></View><Pressable onPress={() => setPlan(null)}><Text style={styles.startOver}>Start over</Text></Pressable></View>
            <View style={styles.mainEditor}><Text style={styles.label}>QUEST NAME</Text><TextInput value={plan.questTitle} onChangeText={questTitle => setPlan({ ...plan, questTitle })} style={styles.questNameInput} multiline /><Text style={styles.label}>SHORT SUMMARY</Text><TextInput value={plan.summary} onChangeText={summary => setPlan({ ...plan, summary })} style={styles.summaryInput} multiline /></View>
            <View style={styles.subtaskHeading}><Text style={styles.subtaskLabel}>SUBTASKS</Text><Text style={styles.subtaskCount}>{plan.tasks.length}</Text></View>
            {plan.tasks.map((task, index) => <TaskEditor key={task.id} task={task} index={index} onChange={patch => updateTask(task.id, patch)} onDelete={() => removeTask(task.id)} />)}
            <Pressable onPress={addTask} style={styles.addTask}><Text style={styles.addTaskIcon}>＋</Text><Text style={styles.addTaskText}>Add another subtask</Text></Pressable>
            <View style={styles.publishCard}><Text style={styles.publishTitle}>Ready for the crew?</Text><Text style={styles.publishText}>Publishing makes this quest visible on the family dashboard.</Text><PrimaryButton title="Commit to family" busy={saving} onPress={commit} accent /></View>
          </View>}
          {!!error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function TaskEditor({ task, index, onChange, onDelete }: { task: QuestTask; index: number; onChange: (patch: Partial<QuestTask>) => void; onDelete: () => void }) {
  const tones = [theme.colors.white, theme.colors.peach, theme.colors.blue, theme.colors.lavender];
  return <View style={[styles.taskCard,{backgroundColor:tones[index%tones.length]}]}>
    <View style={styles.taskTop}><View style={styles.taskNumberBadge}><Text style={styles.taskNumber}>{String(index + 1).padStart(2, '0')}</Text></View><Pressable hitSlop={10} onPress={onDelete} style={styles.deleteButton}><Text style={styles.delete}>Delete</Text></Pressable></View>
    <Text style={styles.label}>TASK NAME</Text><TextInput value={task.title} onChangeText={title => onChange({ title })} style={styles.taskTitleInput} multiline />
    <Text style={styles.label}>DETAILS</Text><TextInput value={task.description} onChangeText={description => onChange({ description })} placeholder="Add useful instructions" placeholderTextColor="rgba(21,40,32,.3)" style={styles.taskDescriptionInput} multiline />
    <View style={styles.timeRow}><Text style={styles.label}>EST. MINUTES</Text><TextInput value={String(task.estimatedMinutes)} onChangeText={value => onChange({ estimatedMinutes: Math.max(1, Number(value.replace(/\D/g, '')) || 1) })} keyboardType="number-pad" style={styles.timeInput} /></View>
    <Text style={styles.label}>WHO CAN DO IT?</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.skillRow}>{skillOptions.map(skill => <Pressable key={skill} onPress={() => onChange({ skill })} style={[styles.skillChip, task.skill === skill && styles.skillSelected]}><Text style={[styles.skillText, task.skill === skill && styles.skillTextSelected]}>{skill}</Text></Pressable>)}</ScrollView>
    {task.skill === 'driver' && <><Text style={styles.label}>DESTINATION OR ADDRESS</Text><TextInput value={task.destination || ''} onChangeText={destination => onChange({ destination })} placeholder="Dubai Mall, Downtown Dubai" placeholderTextColor="rgba(21,40,32,.3)" style={styles.destinationInput} /></>}
    <Pressable onPress={() => onChange({ doTogether: !task.doTogether })} style={[styles.together, task.doTogether && styles.togetherSelected]}><View style={[styles.checkbox, task.doTogether && styles.checkboxSelected]}>{task.doTogether && <Text style={styles.check}>✓</Text>}</View><View><Text style={styles.togetherTitle}>Better together</Text><Text style={styles.togetherCaption}>Suggest two or more family members</Text></View></Pressable>
  </View>;
}

function PrimaryButton({ title, busy, onPress, accent = false }: { title: string; busy: boolean; onPress: () => void; accent?: boolean }) {
  return <Pressable disabled={busy} onPress={onPress} style={[styles.primary, accent && styles.primaryAccent, busy && styles.disabled]}>{busy ? <ActivityIndicator color={theme.colors.white} /> : <><Text style={styles.primaryText}>{title}</Text><View style={styles.arrow}><Text style={styles.arrowText}>↗</Text></View></>}</Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.paper }, flex: { flex: 1 },
  topbar: { minHeight: 72, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.paper },
  backButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border }, back: { color: theme.colors.ink, fontSize: 29, lineHeight: 31 }, topIdentity: { flex: 1 }, topTitle: { color: theme.colors.ink, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 }, topFamily: { color: theme.colors.muted, fontSize: 11, fontWeight: '700', marginTop: 2 }, topSpark: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.lavender }, topSparkText: { color: theme.colors.ink, fontSize: 17 },
  page: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: 20, paddingBottom: 50 },
  hero: { position: 'relative', marginTop: 20, marginBottom: 20, paddingTop: 18, paddingBottom: 10 }, heroIcon: { position: 'absolute', right: 0, top: 14, width: 46, height: 46, borderRadius: 15, backgroundColor: theme.colors.lavender, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border }, heroIconText: { color: theme.colors.ink, fontSize: 19 }, eyebrow: { alignSelf: 'flex-start', color: theme.colors.brand, fontSize: 10, fontWeight: '900', letterSpacing: 1.3, borderWidth: 1, borderColor: theme.colors.ink, borderRadius: 99, paddingHorizontal: 11, paddingVertical: 6 },
  title: { maxWidth: 450, marginTop: 18, paddingRight: 28, color: theme.colors.ink, fontSize: 34, lineHeight: 37, fontWeight: '900', letterSpacing: -1.5 }, mintText: { color: theme.colors.orange }, subtitle: { maxWidth: 480, marginTop: 10, color: theme.colors.muted, fontSize: 13, lineHeight: 20 }, builderPath: { marginTop: 18, flexDirection: 'row', gap: 6 }, pathStep: { flex: 1, minHeight: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(21,40,32,.07)' }, pathActive: { backgroundColor: theme.colors.brand }, pathText: { color: theme.colors.muted, fontSize: 7.5, fontWeight: '900', letterSpacing: .4 }, pathActiveText: { color: theme.colors.white, fontSize: 7.5, fontWeight: '900', letterSpacing: .4 },
  composer: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 24, padding: 20, backgroundColor: theme.colors.white }, composerTop: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingBottom: 17, marginBottom: 17, borderBottomWidth: 1, borderBottomColor: theme.colors.border }, composerMark: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.lavender }, composerMarkText: { color: theme.colors.brand, fontSize: 10, fontWeight: '900' }, composerTitle: { color: theme.colors.ink, fontSize: 14, fontWeight: '900' }, composerHint: { color: theme.colors.muted, fontSize: 10, marginTop: 2 },
  label: { color: theme.colors.ink, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 7 }, choreInput: { minHeight: 128, textAlignVertical: 'top', color: theme.colors.ink, fontSize: 19, lineHeight: 27, fontWeight: '700', padding: 14, borderRadius: 16, backgroundColor: theme.colors.paper },
  examples: { gap: 7, paddingTop: 14 }, example: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 99, paddingHorizontal: 13, paddingVertical: 8, backgroundColor: theme.colors.white }, exampleText: { color: theme.colors.ink, fontSize: 10, fontWeight: '800' },
  primary: { minHeight: 54, borderRadius: 18, marginTop: 18, paddingLeft: 19, paddingRight: 8, backgroundColor: theme.colors.brand, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, primaryAccent: { backgroundColor: theme.colors.orange }, primaryText: { color: theme.colors.white, fontSize: 13, fontWeight: '900' }, arrow: { width: 38, height: 38, borderRadius: 14, backgroundColor: theme.colors.lime, alignItems: 'center', justifyContent: 'center' }, arrowText: { color: theme.colors.ink, fontSize: 18 }, disabled: { opacity: .6 },
  draftHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }, draftLabel: { color: theme.colors.orange, fontSize: 9, fontWeight: '900', letterSpacing: 1 }, draftHint: { marginTop: 3, color: theme.colors.muted, fontSize: 11 }, startOver: { color: theme.colors.ink, fontSize: 11, fontWeight: '800', textDecorationLine: 'underline' },
  mainEditor: { padding: 19, borderRadius: 22, backgroundColor: theme.colors.mint, borderWidth: 1, borderColor: theme.colors.ink, marginBottom: 25 }, questNameInput: { color: theme.colors.ink, fontSize: 24, lineHeight: 29, fontWeight: '900', marginBottom: 17 }, summaryInput: { minHeight: 48, textAlignVertical: 'top', color: theme.colors.ink, fontSize: 13, lineHeight: 19 },
  subtaskHeading: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 11 }, subtaskLabel: { color: theme.colors.ink, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, subtaskCount: { color: theme.colors.muted, fontSize: 10, fontWeight: '900' },
  taskCard: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 20, padding: 17, marginBottom: 12 }, taskTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }, taskNumberBadge: { minWidth: 34, height: 27, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.brand }, taskNumber: { color: theme.colors.white, fontSize: 9, fontWeight: '900' }, deleteButton: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9, backgroundColor: 'rgba(255,255,255,.65)' }, delete: { color: theme.colors.error, fontSize: 9, fontWeight: '900' },
  taskTitleInput: { color: theme.colors.ink, fontSize: 18, lineHeight: 23, fontWeight: '900', borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 9, marginBottom: 14 }, taskDescriptionInput: { minHeight: 50, textAlignVertical: 'top', color: theme.colors.ink, fontSize: 13, lineHeight: 19, borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 9, marginBottom: 14 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }, timeInput: { width: 68, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, color: theme.colors.ink, fontWeight: '800', textAlign: 'center' },
  skillRow: { gap: 7, paddingBottom: 15 }, skillChip: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 99, paddingHorizontal: 13, paddingVertical: 8, backgroundColor: 'rgba(255,255,255,.65)' }, skillSelected: { backgroundColor: theme.colors.brand, borderColor: theme.colors.brand }, skillText: { color: theme.colors.muted, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }, skillTextSelected: { color: theme.colors.white },
  destinationInput: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 11, color: theme.colors.ink, fontSize: 13, marginBottom: 15, backgroundColor: theme.colors.white },
  together: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 10, backgroundColor: 'rgba(21,40,32,.05)' }, togetherSelected: { backgroundColor: theme.colors.mint }, checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' }, checkboxSelected: { backgroundColor: theme.colors.ink, borderColor: theme.colors.ink }, check: { color: theme.colors.lime, fontSize: 13, fontWeight: '900' }, togetherTitle: { color: theme.colors.ink, fontSize: 11, fontWeight: '900' }, togetherCaption: { color: theme.colors.muted, fontSize: 9, marginTop: 1 },
  addTask: { minHeight: 54, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.colors.ink, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.colors.white }, addTaskIcon: { color: theme.colors.orange, fontSize: 20 }, addTaskText: { color: theme.colors.ink, fontSize: 12, fontWeight: '900' },
  publishCard: { marginTop: 28, padding: 19, borderRadius: 24, backgroundColor: theme.colors.ink }, publishTitle: { color: theme.colors.white, fontSize: 20, fontWeight: '900' }, publishText: { color: 'rgba(255,255,255,.62)', fontSize: 12, lineHeight: 18, marginTop: 4 }, error: { color: theme.colors.error, fontSize: 12, fontWeight: '800', marginTop: 18 },
});
