import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { OffsetCard } from '../components/OffsetCard';
import { updateUserProfile } from '../services/database';
import type { CapabilityRole, Family, User } from '../types';
import { theme } from '../theme';

export function ProfileScreen({ user, family, onBack, onSaved }: { user: User; family: Family; onBack: () => void; onSaved: () => Promise<void> }) {
  const db = useSQLiteContext();
  const [name, setName] = useState(user.name);
  const [age, setAge] = useState(String(user.age));
  const [roles, setRoles] = useState<CapabilityRole[]>(user.roles.filter(role => role === 'cook' || role === 'driver'));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const ageNumber = Number(age);
  const toggleRole = (role: CapabilityRole) => setRoles(current => current.includes(role) ? current.filter(item => item !== role) : [...current, role]);
  const save = async () => {
    setError(''); setBusy(true);
    try { await updateUserProfile(db, user.id, { name, age: ageNumber, roles }); await onSaved(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Could not update your profile.'); }
    finally { setBusy(false); }
  };

  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={styles.topbar}><Pressable accessibilityRole="button" accessibilityLabel="Back to home" hitSlop={10} onPress={onBack} style={styles.backButton}><Text style={styles.back}>‹</Text></Pressable><View style={styles.topIdentity}><Text style={styles.topTitle}>YOUR PROFILE</Text><Text style={styles.topFamily}>{family.name}</Text></View><View style={styles.avatar}><Text style={styles.avatarText}>{name.trim().slice(0, 1).toUpperCase() || '?'}</Text></View></View>
    <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.hero}><Text style={styles.eyebrow}>FAMILY CREW MEMBER</Text><Text style={styles.title}>Make this space feel <Text style={styles.orange}>like you.</Text></Text><Text style={styles.subtitle}>Keep your details and capability badges up to date so HomeQuest can match the right tasks to you.</Text></View>
      <OffsetCard contentStyle={styles.card} radius={24} shadowColor={theme.colors.mint}>
        <Field label="Full name" value={name} onChangeText={setName} autoCapitalize="words" />
        <View style={styles.row}><View style={styles.age}><Field label="Age" value={age} onChangeText={value => { setAge(value.replace(/\D/g, '')); if (Number(value) < 16) setRoles(current => current.filter(role => role !== 'driver')); }} keyboardType="number-pad" /></View><View style={styles.email}><Field label="Email" value={user.email} editable={false} /></View></View>
        <Text style={styles.label}>CAPABILITY BADGES</Text><Text style={styles.hint}>Anyone is always included. Adult is added automatically at 18.</Text>
        <View style={styles.roles}><Role title="Cook" mark="⌁" selected={roles.includes('cook')} onPress={() => toggleRole('cook')} /><Role title="Driver" mark="↗" selected={roles.includes('driver')} disabled={age !== '' && ageNumber < 16} onPress={() => toggleRole('driver')} /></View>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Pressable accessibilityRole="button" onPress={save} disabled={busy} style={[styles.save, busy && styles.disabled]}>{busy ? <ActivityIndicator color={theme.colors.white} /> : <><Text style={styles.saveText}>Save profile</Text><View style={styles.arrow}><Text style={styles.arrowText}>↗</Text></View></>}</Pressable>
      </OffsetCard>
    </ScrollView>
  </KeyboardAvoidingView></SafeAreaView>;
}

type FieldProps = React.ComponentProps<typeof TextInput> & { label: string };
function Field({ label, ...props }: FieldProps) { return <View style={styles.field}><Text style={styles.label}>{label.toUpperCase()}</Text><TextInput {...props} style={[styles.input, props.editable === false && styles.readOnly]} placeholderTextColor="rgba(21,40,32,.32)" /></View>; }
function Role({ title, mark, selected, disabled, onPress }: { title: string; mark: string; selected: boolean; disabled?: boolean; onPress: () => void }) { return <Pressable disabled={disabled} onPress={onPress} style={[styles.role, selected && styles.roleSelected, disabled && styles.disabled]}><View style={styles.roleMark}><Text style={styles.roleMarkText}>{mark}</Text></View><View><Text style={styles.roleTitle}>{title}</Text><Text style={styles.roleCaption}>{title === 'Driver' ? 'Age 16+' : 'Prepare meals'}</Text></View><Text style={styles.check}>{selected ? '✓' : ''}</Text></Pressable>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.paper }, flex: { flex: 1 },
  topbar: { minHeight: 68, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border }, backButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border }, back: { color: theme.colors.ink, fontSize: 29, lineHeight: 31 }, topIdentity: { flex: 1 }, topTitle: { color: theme.colors.ink, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 }, topFamily: { color: theme.colors.muted, fontSize: 11, fontWeight: '700', marginTop: 2 }, avatar: { width: 43, height: 43, borderRadius: 22, borderWidth: 2, borderColor: theme.colors.success, backgroundColor: theme.colors.mint, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: theme.colors.ink, fontSize: 17, fontWeight: '900' },
  page: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: 20, paddingBottom: 50 }, hero: { paddingVertical: 27, paddingHorizontal: 2 }, eyebrow: { color: theme.colors.success, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 }, title: { maxWidth: 480, color: theme.colors.ink, fontSize: 39, lineHeight: 42, fontWeight: '900', letterSpacing: -1.7, marginTop: 12 }, orange: { color: theme.colors.orange }, subtitle: { maxWidth: 490, color: theme.colors.muted, fontSize: 13, lineHeight: 20, marginTop: 11 },
  card: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 24, padding: 20, backgroundColor: theme.colors.white }, field: { marginBottom: 15 }, label: { color: theme.colors.ink, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 7 }, input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: theme.colors.ink, backgroundColor: theme.colors.paper }, readOnly: { color: theme.colors.muted, opacity: .8 }, row: { flexDirection: 'row', gap: 10 }, age: { width: 86 }, email: { flex: 1 }, hint: { color: theme.colors.muted, fontSize: 10, marginTop: -2, marginBottom: 10 }, roles: { flexDirection: 'row', gap: 9 }, role: { flex: 1, minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 15, padding: 10, backgroundColor: theme.colors.paper }, roleSelected: { backgroundColor: theme.colors.mint, borderColor: theme.colors.ink }, roleMark: { width: 32, height: 32, borderRadius: 11, backgroundColor: theme.colors.lavender, alignItems: 'center', justifyContent: 'center' }, roleMarkText: { color: theme.colors.ink }, roleTitle: { color: theme.colors.ink, fontSize: 12, fontWeight: '800' }, roleCaption: { color: theme.colors.muted, fontSize: 9 }, check: { marginLeft: 'auto', color: theme.colors.ink, fontWeight: '900' }, error: { color: theme.colors.error, fontSize: 12, fontWeight: '800', marginTop: 14 }, save: { marginTop: 20, minHeight: 52, borderRadius: 16, paddingLeft: 18, paddingRight: 8, backgroundColor: theme.colors.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, saveText: { color: theme.colors.white, fontSize: 13, fontWeight: '900' }, arrow: { width: 36, height: 36, borderRadius: 12, backgroundColor: theme.colors.lime, alignItems: 'center', justifyContent: 'center' }, arrowText: { color: theme.colors.ink, fontSize: 18 }, disabled: { opacity: .45 },
});
