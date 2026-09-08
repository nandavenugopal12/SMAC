import React, { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { login, register } from '../services/database';
import type { CapabilityRole } from '../types';
import { theme } from '../theme';

const FAMILY_FACES = [require('./mom.png'), require('./dad.png'), require('./Ali.png'), require('./Ayesha.png')];

export function LoginScreen({ onAuthenticated }: { onAuthenticated: () => Promise<void> }) {
  const db = useSQLiteContext();
  const compact = useWindowDimensions().width < 380;
  const [mode, setMode] = useState<'signup' | 'login'>('login');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState<CapabilityRole[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const ageNumber = Number(age);
  const driverDisabled = age !== '' && ageNumber < 16;

  const toggleRole = (role: CapabilityRole) => setRoles(current => current.includes(role) ? current.filter(item => item !== role) : [...current, role]);
  const switchMode = (next: 'signup' | 'login') => { setMode(next); setError(''); setPassword(''); };
  const submit = async () => {
    setError(''); setBusy(true);
    try {
      if (mode === 'signup') await register(db, { name, email, password, age: Number(age), roles });
      else await login(db, email, password);
      setPassword('');
      await onAuthenticated();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Something went wrong.'); }
    finally { setBusy(false); }
  };

  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, compact && styles.heroCompact]}>
          <View style={styles.peachOrb} /><View style={styles.blueOrb} /><View style={styles.limeDash} />
          <View style={styles.brandRow}><View style={styles.logo}><Text style={styles.logoText}>HQ</Text></View><View><Text style={styles.brand}>HOMEQUEST</Text><Text style={styles.brandSub}>YOUR FAMILY SPACE</Text></View></View>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>WELCOME HOME</Text>
            <Text style={[styles.title, compact && styles.titleCompact]}>{mode === 'login' ? 'Everything works better ' : 'Make family life feel '}<Text style={styles.orange}>{mode === 'login' ? 'together.' : 'lighter.'}</Text></Text>
            <Text style={styles.subtitle}>{mode === 'login' ? 'Come back to the people, plans, and little wins that keep your home moving.' : 'Create your profile and turn everyday needs into shared family quests.'}</Text>
          </View>
          <View style={styles.familyRow}>
            <View style={styles.faceStack}>{FAMILY_FACES.map((source, index) => <View key={index} style={[styles.faceWrap, index > 0 && styles.faceOverlap]}><Image source={source} style={styles.face} /></View>)}</View>
            <View><Text style={styles.familyLabel}>THE WHOLE CREW</Text><Text style={styles.familyCaption}>Ask · offer · do it together</Text></View>
          </View>
        </View>

        <View style={[styles.formShell, compact && styles.formCompact]}>
          <View style={styles.tabs}>
            <Pressable onPress={() => switchMode('login')} style={[styles.tab, mode === 'login' && styles.activeTab]} accessibilityRole="tab" accessibilityState={{ selected: mode === 'login' }}><Text style={[styles.tabText, mode === 'login' && styles.activeTabText]}>Log in</Text></Pressable>
            <Pressable onPress={() => switchMode('signup')} style={[styles.tab, mode === 'signup' && styles.activeTab]} accessibilityRole="tab" accessibilityState={{ selected: mode === 'signup' }}><Text style={[styles.tabText, mode === 'signup' && styles.activeTabText]}>Create account</Text></Pressable>
          </View>
          <Text style={styles.formKicker}>{mode === 'login' ? 'GOOD TO SEE YOU' : 'JOIN THE CREW'}</Text>
          <Text style={styles.formTitle}>{mode === 'login' ? 'Welcome back.' : 'Create your profile.'}</Text>
          <Text style={styles.formSubtitle}>{mode === 'login' ? 'Your family space is ready when you are.' : 'Tell the crew a little about what you can do.'}</Text>

          {mode === 'signup' && <>
            <Field label="Full name" value={name} onChangeText={setName} placeholder="Alex Morgan" autoCapitalize="words" />
            <View style={[styles.inputRow, compact && styles.inputRowCompact]}><View style={styles.ageField}><Field label="Age" value={age} onChangeText={value => { setAge(value.replace(/\D/g, '')); if (Number(value) < 16) setRoles(items => items.filter(role => role !== 'driver')); }} placeholder="16" keyboardType="number-pad" /></View><View style={styles.grow}><Field label="Email" value={email} onChangeText={setEmail} placeholder="alex@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" /></View></View>
          </>}
          {mode === 'login' && <Field label="Email" value={email} onChangeText={setEmail} placeholder="alex@example.com" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />}
          <Field label="Password" value={password} onChangeText={setPassword} placeholder="8 characters minimum" secureTextEntry autoCapitalize="none" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} onSubmitEditing={submit} />

          {mode === 'signup' && <View style={styles.badgeSection}>
            <Text style={styles.label}>WHAT CAN YOU HELP WITH?</Text><Text style={styles.hint}>Anyone is included automatically. Choose any extra badges.</Text>
            <View style={[styles.roles, compact && styles.rolesCompact]}><Role title="Cook" caption="Meals & groceries" mark="⌁" tone={theme.colors.peach} selected={roles.includes('cook')} onPress={() => toggleRole('cook')} /><Role title="Driver" caption="Trips & pickups" mark="↗" tone={theme.colors.blue} selected={roles.includes('driver')} disabled={driverDisabled} onPress={() => toggleRole('driver')} /></View>
          </View>}

          {!!error && <View style={styles.errorBox}><Text style={styles.errorMark}>!</Text><Text style={styles.error}>{error}</Text></View>}
          <Pressable accessibilityRole="button" onPress={submit} disabled={busy} style={({ pressed }) => [styles.button, pressed && styles.pressed, busy && styles.disabled]}>{busy ? <ActivityIndicator color={theme.colors.white} /> : <><Text style={styles.buttonText}>{mode === 'signup' ? 'Create my profile' : 'Enter HomeQuest'}</Text><View style={styles.arrow}><Text style={styles.arrowText}>↗</Text></View></>}</Pressable>
          <Text style={styles.privacy}>A private space for your family crew.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

type FieldProps = React.ComponentProps<typeof TextInput> & { label: string };
function Field({ label, ...props }: FieldProps) { return <View style={styles.field}><Text style={styles.label}>{label.toUpperCase()}</Text><TextInput {...props} style={styles.input} placeholderTextColor="rgba(21,40,32,.32)" returnKeyType={props.secureTextEntry ? 'go' : 'next'} /></View>; }
function Role({ title, caption, mark, tone, selected, disabled, onPress }: { title: string; caption: string; mark: string; tone: string; selected: boolean; disabled?: boolean; onPress: () => void }) { return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected, disabled }} disabled={disabled} onPress={onPress} style={[styles.role, selected && styles.roleSelected, disabled && styles.roleDisabled]}><View style={[styles.roleDot, { backgroundColor: tone }]}><Text style={styles.roleMark}>{mark}</Text></View><View style={styles.roleCopy}><Text style={styles.roleTitle}>{title}</Text><Text style={styles.roleCaption}>{caption}</Text></View><View style={[styles.roleCheck, selected && styles.roleCheckSelected]}>{selected && <Text style={styles.roleCheckText}>✓</Text>}</View></Pressable>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.ink }, flex: { flex: 1 }, page: { flexGrow: 1, backgroundColor: theme.colors.paper },
  hero: { minHeight: 390, overflow: 'hidden', paddingHorizontal: 22, paddingTop: 12, paddingBottom: 52, backgroundColor: theme.colors.ink }, heroCompact: { minHeight: 360, paddingHorizontal: 18 },
  peachOrb: { position: 'absolute', width: 190, height: 190, borderRadius: 95, right: -75, top: 34, backgroundColor: theme.colors.peach, opacity: .92 }, blueOrb: { position: 'absolute', width: 88, height: 88, borderRadius: 44, right: 62, top: 105, backgroundColor: theme.colors.blue, opacity: .94 }, limeDash: { position: 'absolute', width: 82, height: 17, borderRadius: 9, right: -18, bottom: 82, backgroundColor: theme.colors.lime, transform: [{ rotate: '-15deg' }] },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, logo: { width: 43, height: 43, borderRadius: 15, backgroundColor: theme.colors.brand, borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-5deg' }] }, logoText: { color: theme.colors.white, fontSize: 16, fontWeight: '900' }, brand: { color: theme.colors.white, fontSize: 16, fontWeight: '900', letterSpacing: 1.6 }, brandSub: { color: 'rgba(255,255,255,.58)', fontSize: 8, fontWeight: '900', letterSpacing: 1.2, marginTop: 2 },
  heroCopy: { marginTop: 47, maxWidth: 480 }, eyebrow: { color: theme.colors.mint, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 }, title: { maxWidth: 390, marginTop: 11, color: theme.colors.white, fontSize: 43, lineHeight: 45, fontWeight: '900', letterSpacing: -2 }, titleCompact: { fontSize: 38, lineHeight: 40 }, orange: { color: theme.colors.orange }, subtitle: { maxWidth: 350, marginTop: 13, color: 'rgba(255,255,255,.68)', fontSize: 13, lineHeight: 20 },
  familyRow: { marginTop: 25, flexDirection: 'row', alignItems: 'center', gap: 12 }, faceStack: { flexDirection: 'row' }, faceWrap: { width: 37, height: 37, borderRadius: 19, padding: 2, backgroundColor: theme.colors.paper }, faceOverlap: { marginLeft: -10 }, face: { width: 33, height: 33, borderRadius: 17 }, familyLabel: { color: theme.colors.white, fontSize: 8, fontWeight: '900', letterSpacing: 1 }, familyCaption: { marginTop: 2, color: 'rgba(255,255,255,.55)', fontSize: 9 },
  formShell: { width: '100%', maxWidth: 620, alignSelf: 'center', marginTop: -30, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 32, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: theme.colors.paper }, formCompact: { paddingHorizontal: 16 },
  tabs: { flexDirection: 'row', gap: 5, padding: 5, borderRadius: 16, backgroundColor: 'rgba(21,40,32,.07)', marginBottom: 25 }, tab: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12 }, activeTab: { backgroundColor: theme.colors.white, borderWidth: 1, borderColor: theme.colors.border, shadowColor: theme.colors.ink, shadowOpacity: .08, shadowRadius: 7, elevation: 2 }, tabText: { color: theme.colors.muted, fontSize: 11, fontWeight: '800' }, activeTabText: { color: theme.colors.brand },
  formKicker: { color: theme.colors.brand, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 }, formTitle: { marginTop: 5, color: theme.colors.ink, fontSize: 29, lineHeight: 34, fontWeight: '900', letterSpacing: -1 }, formSubtitle: { color: theme.colors.muted, fontSize: 12, marginTop: 3, marginBottom: 22 },
  field: { marginBottom: 14 }, label: { color: theme.colors.ink, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 7 }, input: { minHeight: 53, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 15, paddingHorizontal: 15, paddingVertical: 13, fontSize: 14, color: theme.colors.ink, backgroundColor: theme.colors.white }, inputRow: { flexDirection: 'row', gap: 10 }, inputRowCompact: { flexDirection: 'column', gap: 0 }, ageField: { width: 88 }, grow: { flex: 1 },
  badgeSection: { marginTop: 2 }, hint: { color: theme.colors.muted, fontSize: 10, lineHeight: 15, marginTop: -2, marginBottom: 10 }, roles: { flexDirection: 'row', gap: 9 }, rolesCompact: { flexDirection: 'column' }, role: { flex: 1, minHeight: 65, flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 16, padding: 10, backgroundColor: theme.colors.white }, roleSelected: { borderColor: theme.colors.brand, backgroundColor: theme.colors.mint }, roleDisabled: { opacity: .38 }, roleDot: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, roleMark: { color: theme.colors.ink, fontSize: 16, fontWeight: '900' }, roleCopy: { flex: 1 }, roleTitle: { color: theme.colors.ink, fontSize: 12, fontWeight: '900' }, roleCaption: { color: theme.colors.muted, fontSize: 8.5, marginTop: 1 }, roleCheck: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' }, roleCheckSelected: { borderColor: theme.colors.brand, backgroundColor: theme.colors.brand }, roleCheckText: { color: theme.colors.white, fontSize: 10, fontWeight: '900' },
  errorBox: { marginTop: 14, padding: 11, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: theme.colors.peach }, errorMark: { width: 22, height: 22, borderRadius: 11, overflow: 'hidden', textAlign: 'center', paddingTop: 2, color: theme.colors.white, backgroundColor: theme.colors.error, fontWeight: '900' }, error: { flex: 1, color: theme.colors.error, fontSize: 11, lineHeight: 16, fontWeight: '800' },
  button: { marginTop: 20, minHeight: 57, borderRadius: 18, backgroundColor: theme.colors.brand, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 9, shadowColor: theme.colors.brand, shadowOpacity: .2, shadowOffset: { width: 0, height: 7 }, shadowRadius: 12, elevation: 4 }, buttonText: { color: theme.colors.white, fontSize: 13, fontWeight: '900' }, arrow: { width: 39, height: 39, borderRadius: 14, backgroundColor: theme.colors.lime, alignItems: 'center', justifyContent: 'center' }, arrowText: { color: theme.colors.ink, fontSize: 18 }, pressed: { transform: [{ scale: .99 }] }, disabled: { opacity: .6 }, privacy: { marginTop: 13, color: theme.colors.muted, textAlign: 'center', fontSize: 9.5 },
});
