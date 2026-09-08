import React, { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import MapView, { Marker, type MapPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import { breakDownChore } from '../services/gemini';
import { saveQuest } from '../services/database';
import type { CapabilityRole, Family, QuestCategory, QuestPlan, QuestTask, User } from '../types';
import { theme } from '../theme';
import { OffsetCard } from '../components/OffsetCard';

const skillOptions: CapabilityRole[] = ['anyone', 'cook', 'driver', 'adult'];
const examples = ['Clean the kitchen after a big family dinner', 'Do the weekly grocery run and put everything away', 'Get ready and packed for a beach day'];

const inferCategory = (text: string): QuestCategory => {
  const value = text.toLowerCase();
  if (/drive|pickup|pick up|drop.?off|transport|route|errand/.test(value)) return 'route';
  if (/clean|tidy|wash|laundry|dish|vacuum|mop|organize/.test(value)) return 'clean';
  if (/food|cook|meal|dinner|lunch|breakfast|grocery|kitchen/.test(value)) return 'food';
  return 'family';
};

export function CreateTaskScreen({ user, family, initialPrompt = '', initialCategory, onBack, onCommitted }: {
  user: User;
  family: Family;
  initialPrompt?: string;
  initialCategory?: QuestCategory;
  onBack: () => void;
  onCommitted: () => void;
}) {
  const db = useSQLiteContext();
  const [chore, setChore] = useState(initialPrompt);
  const [plan, setPlan] = useState<QuestPlan | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [pickingTaskId, setPickingTaskId] = useState<number | null>(null);

  const generate = async () => {
    if (chore.trim().length < 3) return setError('Add a little more detail about the task.');
    setError(''); setGenerating(true);
    try { const generated = await breakDownChore(chore); setPlan({ ...generated, category: initialCategory || inferCategory(chore) }); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not generate subtasks.'); }
    finally { setGenerating(false); }
  };

  const updateTask = (id: number, patch: Partial<QuestTask>) => setPlan(current => current ? { ...current, tasks: current.tasks.map(task => task.id === id ? { ...task, ...patch } : task) } : current);
  const removeTask = (id: number) => setPlan(current => current ? { ...current, tasks: current.tasks.filter(task => task.id !== id) } : current);
  const addTask = () => setPlan(current => current ? { ...current, tasks: [...current.tasks, { id: -Date.now(), title: 'New subtask', description: '', estimatedMinutes: 10, skill: 'anyone', doTogether: false, destination: '' }] } : current);
  const commit = async () => {
    if (!plan) return;
    if (plan.tasks.some(task => task.skill === 'driver' && (!Number.isFinite(task.destinationLatitude) || !Number.isFinite(task.destinationLongitude)))) return setError('Pin a destination on the map for every driver task.');
    setError(''); setSaving(true);
    try { await saveQuest(db, family.id, user.id, plan); onCommitted(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not publish this task.'); }
    finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topbar}><Pressable hitSlop={10} onPress={onBack}><Text style={styles.back}>← Back</Text></Pressable><Image accessible accessibilityLabel="Nayah" source={require('../assets/nayah-logo.png')} resizeMode="contain" style={styles.topLogo} /><View style={styles.topSpacer} /></View>
        <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.hero}><Text style={styles.eyebrow}>AI QUEST BUILDER</Text><Text style={styles.title}>What needs to <Text style={styles.orange}>get done?</Text></Text></View>

          {!plan && <OffsetCard contentStyle={styles.composer} radius={20}>
            <Text style={styles.label}>DESCRIBE THE MAIN TASK</Text>
            <TextInput value={chore} onChangeText={setChore} placeholder="Prepare the house and dinner for Grandma's birthday" placeholderTextColor="rgba(21,40,32,.3)" multiline maxLength={500} style={styles.choreInput} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.examples}>{examples.map((item, index) => <Pressable key={item} onPress={() => setChore(item)} style={styles.example}><Text style={styles.exampleText}>{['Kitchen reset', 'Grocery run', 'Beach prep'][index]}</Text></Pressable>)}</ScrollView>
            <PrimaryButton title="Generate subtasks" busy={generating} onPress={generate} />
          </OffsetCard>}

          {plan && <View>
            <View style={styles.draftHeader}><View><Text style={styles.draftLabel}>DRAFT · NOT PUBLISHED</Text><Text style={styles.draftHint}>Edit anything before committing.</Text></View><Pressable onPress={() => setPlan(null)}><Text style={styles.startOver}>Start over</Text></Pressable></View>
            <View style={styles.mainEditor}><Text style={styles.label}>QUEST NAME</Text><TextInput value={plan.questTitle} onChangeText={questTitle => setPlan({ ...plan, questTitle })} style={styles.questNameInput} multiline /><Text style={styles.label}>SHORT SUMMARY</Text><TextInput value={plan.summary} onChangeText={summary => setPlan({ ...plan, summary })} style={styles.summaryInput} multiline /></View>
            <View style={styles.subtaskHeading}><Text style={styles.subtaskLabel}>SUBTASKS</Text><Text style={styles.subtaskCount}>{plan.tasks.length}</Text></View>
            {plan.tasks.map((task, index) => <TaskEditor key={task.id} task={task} index={index} onChange={patch => updateTask(task.id, patch)} onDelete={() => removeTask(task.id)} onPickDestination={() => setPickingTaskId(task.id)} />)}
            <Pressable onPress={addTask} style={styles.addTask}><Text style={styles.addTaskIcon}>＋</Text><Text style={styles.addTaskText}>Add another subtask</Text></Pressable>
            <View style={styles.publishCard}><Text style={styles.publishTitle}>Ready for the crew?</Text><Text style={styles.publishText}>Publishing makes this quest visible on the family dashboard.</Text><PrimaryButton title="Commit to family" busy={saving} onPress={commit} accent /></View>
          </View>}
          {!!error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
      <DestinationPicker
        visible={pickingTaskId !== null}
        task={plan?.tasks.find(task => task.id === pickingTaskId) || null}
        onClose={() => setPickingTaskId(null)}
        onConfirm={(coordinates, label) => {
          if (pickingTaskId !== null) updateTask(pickingTaskId, { destinationLatitude: coordinates.latitude, destinationLongitude: coordinates.longitude, destination: label });
          setPickingTaskId(null);
        }}
      />
    </SafeAreaView>
  );
}

function TaskEditor({ task, index, onChange, onDelete, onPickDestination }: { task: QuestTask; index: number; onChange: (patch: Partial<QuestTask>) => void; onDelete: () => void; onPickDestination: () => void }) {
  return <View style={styles.taskCard}>
    <View style={styles.taskTop}><Text style={styles.taskNumber}>{String(index + 1).padStart(2, '0')}</Text><Pressable hitSlop={10} onPress={onDelete}><Text style={styles.delete}>Delete</Text></Pressable></View>
    <Text style={styles.label}>TASK NAME</Text><TextInput value={task.title} onChangeText={title => onChange({ title })} style={styles.taskTitleInput} multiline />
    <Text style={styles.label}>DETAILS</Text><TextInput value={task.description} onChangeText={description => onChange({ description })} placeholder="Add useful instructions" placeholderTextColor="rgba(21,40,32,.3)" style={styles.taskDescriptionInput} multiline />
    <View style={styles.timeRow}><Text style={styles.label}>EST. MINUTES</Text><TextInput value={String(task.estimatedMinutes)} onChangeText={value => onChange({ estimatedMinutes: Math.max(1, Number(value.replace(/\D/g, '')) || 1) })} keyboardType="number-pad" style={styles.timeInput} /></View>
    <Text style={styles.label}>WHO CAN DO IT?</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.skillRow}>{skillOptions.map(skill => <Pressable key={skill} onPress={() => onChange({ skill })} style={[styles.skillChip, task.skill === skill && styles.skillSelected]}><Text style={[styles.skillText, task.skill === skill && styles.skillTextSelected]}>{skill}</Text></Pressable>)}</ScrollView>
    {task.skill === 'driver' && <View style={styles.destinationBlock}><Text style={styles.label}>DRIVE DESTINATION</Text><TextInput value={task.destination || ''} onChangeText={destination => onChange({ destination })} placeholder="Optional label, e.g. Grandma's house" placeholderTextColor="rgba(21,40,32,.3)" style={styles.destinationInput} /><Pressable onPress={onPickDestination} style={[styles.mapButton, Number.isFinite(task.destinationLatitude) && styles.mapButtonPinned]}><Text style={styles.mapButtonText}>{Number.isFinite(task.destinationLatitude) ? '✓ Destination pinned — change' : '⌖ Pick precise point on map'}</Text></Pressable></View>}
    <Pressable onPress={() => onChange({ doTogether: !task.doTogether })} style={[styles.together, task.doTogether && styles.togetherSelected]}><View style={[styles.checkbox, task.doTogether && styles.checkboxSelected]}>{task.doTogether && <Text style={styles.check}>✓</Text>}</View><View><Text style={styles.togetherTitle}>Better together</Text><Text style={styles.togetherCaption}>Suggest two or more family members</Text></View></Pressable>
  </View>;
}

type Coordinates = { latitude: number; longitude: number };
function DestinationPicker({ visible, task, onClose, onConfirm }: { visible: boolean; task: QuestTask | null; onClose: () => void; onConfirm: (coordinates: Coordinates, label: string) => void }) {
  const [region, setRegion] = useState<Coordinates | null>(null);
  const [selected, setSelected] = useState<Coordinates | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    const prepare = async () => {
      setError('');
      const existing = Number.isFinite(task?.destinationLatitude) && Number.isFinite(task?.destinationLongitude) ? { latitude: task!.destinationLatitude!, longitude: task!.destinationLongitude! } : null;
      if (existing) { setRegion(existing); setSelected(existing); return; }
      setRegion(null); setSelected(null);
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') throw new Error('Allow location access to open the map near you.');
        const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!cancelled) setRegion({ latitude: current.coords.latitude, longitude: current.coords.longitude });
      } catch (caught) { if (!cancelled) setError(caught instanceof Error ? caught.message : 'Could not open the map.'); }
    };
    prepare();
    return () => { cancelled = true; };
  }, [visible, task?.id, task?.destinationLatitude, task?.destinationLongitude]);

  const choose = (event: MapPressEvent) => setSelected(event.nativeEvent.coordinate);
  const confirm = async () => {
    if (!selected) return;
    setSaving(true);
    let label = task?.destination?.trim() || '';
    if (!label) {
      try {
        const places = await Location.reverseGeocodeAsync(selected);
        const place = places[0];
        label = [place?.name, place?.street, place?.city].filter((part, index, all) => part && all.indexOf(part) === index).join(', ');
      } catch { /* Coordinates remain valid even when a label cannot be resolved. */ }
    }
    onConfirm(selected, label || 'Pinned destination');
    setSaving(false);
  };

  return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}><SafeAreaView style={styles.pickerSafe} edges={['top', 'bottom']}><View style={styles.pickerTop}><Pressable onPress={onClose}><Text style={styles.pickerCancel}>Cancel</Text></Pressable><Text style={styles.pickerTitle}>PIN DESTINATION</Text><Pressable disabled={!selected || saving} onPress={confirm}><Text style={[styles.pickerConfirm, !selected && styles.pickerDisabled]}>{saving ? 'Saving…' : 'Use pin'}</Text></Pressable></View><View style={styles.pickerMapWrap}>{region ? <MapView style={styles.pickerMap} initialRegion={{ ...region, latitudeDelta: .025, longitudeDelta: .025 }} showsUserLocation showsMyLocationButton onPress={choose}>{selected && <Marker coordinate={selected} title="Task destination" pinColor={theme.colors.orange} draggable onDragEnd={event => setSelected(event.nativeEvent.coordinate)} />}</MapView> : <View style={styles.pickerLoading}><ActivityIndicator color={theme.colors.orange} /><Text style={styles.pickerLoadingText}>{error || 'Finding your location…'}</Text></View>}</View><View style={styles.pickerHelp}><Text style={styles.pickerHelpTitle}>{selected ? 'Destination selected' : 'Tap the map to place a pin'}</Text><Text style={styles.pickerHelpText}>{selected ? `${selected.latitude.toFixed(5)}, ${selected.longitude.toFixed(5)} · Tap elsewhere or drag the pin to adjust.` : 'Zoom and move the map, then tap the exact pickup or drop-off point.'}</Text></View></SafeAreaView></Modal>;
}

function PrimaryButton({ title, busy, onPress, accent = false }: { title: string; busy: boolean; onPress: () => void; accent?: boolean }) {
  return <Pressable disabled={busy} onPress={onPress} style={[styles.primary, accent && styles.primaryAccent, busy && styles.disabled]}>{busy ? <ActivityIndicator color={theme.colors.white} /> : <><Text style={styles.primaryText}>{title}</Text><View style={styles.arrow}><Text style={styles.arrowText}>↗</Text></View></>}</Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.paper }, flex: { flex: 1 },
  topbar: { minHeight: 58, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.colors.border, backgroundColor: 'rgba(250,249,246,.97)' },
  back: { color: theme.colors.ink, fontSize: 13, fontWeight: '800' }, topLogo: { width: 92, height: 28 }, topSpacer: { width: 40 },
  page: { width: '100%', maxWidth: 620, alignSelf: 'center', paddingHorizontal: 18, paddingBottom: 50 },
  hero: { paddingTop: 28, paddingBottom: 25 }, eyebrow: { alignSelf: 'flex-start', fontSize: 10, color: theme.colors.muted, fontWeight: '800', letterSpacing: 1.3 },
  title: { marginTop: 8, color: theme.colors.ink, fontSize: 38, lineHeight: 41, fontWeight: '800', letterSpacing: -1.4 }, orange: { color: theme.colors.orange }, subtitle: { marginTop: 9, color: theme.colors.muted, fontSize: 14, lineHeight: 21 },
  composer: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 24, padding: 18, backgroundColor: theme.colors.white },
  label: { color: theme.colors.ink, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 7 }, choreInput: { minHeight: 135, textAlignVertical: 'top', color: theme.colors.ink, fontSize: 22, lineHeight: 29, fontWeight: '700' },
  examples: { gap: 7, paddingTop: 13, borderTopWidth: 1, borderTopColor: theme.colors.border }, example: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 99, paddingHorizontal: 11, paddingVertical: 7 }, exampleText: { color: theme.colors.ink, fontSize: 10, fontWeight: '700' },
  primary: { minHeight: 52, borderRadius: 26, marginTop: 17, paddingLeft: 19, paddingRight: 8, backgroundColor: theme.colors.orange, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, primaryAccent: { backgroundColor: theme.colors.orange }, primaryText: { color: theme.colors.white, fontSize: 14, fontWeight: '800' }, arrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.lime, alignItems: 'center', justifyContent: 'center' }, arrowText: { color: theme.colors.ink, fontSize: 18 }, disabled: { opacity: .6 },
  draftHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }, draftLabel: { color: theme.colors.orange, fontSize: 9, fontWeight: '900', letterSpacing: 1 }, draftHint: { marginTop: 3, color: theme.colors.muted, fontSize: 11 }, startOver: { color: theme.colors.ink, fontSize: 11, fontWeight: '800', textDecorationLine: 'underline' },
  mainEditor: { padding: 18, borderRadius: 22, backgroundColor: '#FFF3BF', marginBottom: 25 }, questNameInput: { color: theme.colors.ink, fontSize: 24, lineHeight: 29, fontWeight: '800', marginBottom: 17 }, summaryInput: { minHeight: 48, textAlignVertical: 'top', color: theme.colors.ink, fontSize: 13, lineHeight: 19 },
  subtaskHeading: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 11 }, subtaskLabel: { color: theme.colors.ink, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, subtaskCount: { color: theme.colors.muted, fontSize: 10, fontWeight: '900' },
  taskCard: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 20, padding: 16, marginBottom: 11, backgroundColor: theme.colors.white, shadowColor: '#000', shadowOpacity: .04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 }, taskTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }, taskNumber: { color: theme.colors.muted, fontSize: 10, fontWeight: '900' }, delete: { color: theme.colors.error, fontSize: 10, fontWeight: '800' },
  taskTitleInput: { color: theme.colors.ink, fontSize: 18, lineHeight: 23, fontWeight: '900', borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 9, marginBottom: 14 }, taskDescriptionInput: { minHeight: 50, textAlignVertical: 'top', color: theme.colors.ink, fontSize: 13, lineHeight: 19, borderBottomWidth: 1, borderBottomColor: theme.colors.border, paddingBottom: 9, marginBottom: 14 },
  timeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }, timeInput: { width: 68, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, color: theme.colors.ink, fontWeight: '800', textAlign: 'center' },
  skillRow: { gap: 7, paddingBottom: 15 }, skillChip: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 8 }, skillSelected: { backgroundColor: theme.colors.ink, borderColor: theme.colors.ink }, skillText: { color: theme.colors.muted, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }, skillTextSelected: { color: theme.colors.white },
  destinationBlock: { marginBottom: 15 }, destinationInput: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 11, color: theme.colors.ink, fontSize: 13, marginBottom: 8, backgroundColor: theme.colors.white }, mapButton: { minHeight: 44, paddingHorizontal: 13, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.colors.ink, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, mapButtonPinned: { borderStyle: 'solid', backgroundColor: theme.colors.mint }, mapButtonText: { color: theme.colors.ink, fontSize: 11, fontWeight: '900' },
  together: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 10, backgroundColor: 'rgba(21,40,32,.05)' }, togetherSelected: { backgroundColor: theme.colors.mint }, checkbox: { width: 24, height: 24, borderRadius: 7, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' }, checkboxSelected: { backgroundColor: theme.colors.ink, borderColor: theme.colors.ink }, check: { color: theme.colors.lime, fontSize: 13, fontWeight: '900' }, togetherTitle: { color: theme.colors.ink, fontSize: 11, fontWeight: '900' }, togetherCaption: { color: theme.colors.muted, fontSize: 9, marginTop: 1 },
  addTask: { minHeight: 54, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: theme.colors.white, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, addTaskIcon: { color: theme.colors.orange, fontSize: 20 }, addTaskText: { color: theme.colors.ink, fontSize: 12, fontWeight: '800' },
  publishCard: { marginTop: 28, padding: 18, borderRadius: 22, backgroundColor: theme.colors.mint }, publishTitle: { color: theme.colors.ink, fontSize: 20, fontWeight: '800' }, publishText: { color: theme.colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 }, error: { color: theme.colors.error, fontSize: 12, fontWeight: '800', marginTop: 18 },
  pickerSafe: { flex: 1, backgroundColor: theme.colors.paper }, pickerTop: { minHeight: 58, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.colors.border }, pickerCancel: { color: theme.colors.muted, fontSize: 12, fontWeight: '800' }, pickerTitle: { color: theme.colors.ink, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 }, pickerConfirm: { color: theme.colors.orange, fontSize: 12, fontWeight: '900' }, pickerDisabled: { opacity: .35 }, pickerMapWrap: { flex: 1, minHeight: 350, backgroundColor: theme.colors.mint }, pickerMap: { width: '100%', height: '100%' }, pickerLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }, pickerLoadingText: { marginTop: 12, color: theme.colors.muted, textAlign: 'center' }, pickerHelp: { padding: 18, paddingBottom: 12, backgroundColor: theme.colors.paper, borderTopWidth: 2, borderTopColor: theme.colors.ink }, pickerHelpTitle: { color: theme.colors.ink, fontSize: 17, fontWeight: '900' }, pickerHelpText: { marginTop: 4, color: theme.colors.muted, fontSize: 11, lineHeight: 16 },
});
