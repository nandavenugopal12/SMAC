import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OffsetCard } from '../components/OffsetCard';
import { createFamily, joinFamily } from '../services/database';
import type { User } from '../types';
import { theme } from '../theme';

export function FamilyScreen({ user, onFamilyReady, onLogout }: { user: User; onFamilyReady: () => Promise<void>; onLogout: () => Promise<void> }) {
  const db = useSQLiteContext();
  const compact = useWindowDimensions().width < 380;
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState('');
  const act = async (type: 'create' | 'join') => {
    setError(''); setBusy(type);
    try {
      if (type === 'create') await createFamily(db, user.id, name);
      else await joinFamily(db, user.id, code);
      await onFamilyReady();
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'Something went wrong.'); }
    finally { setBusy(null); }
  };
  const offset = compact ? 4 : 5;

  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}><ScrollView contentContainerStyle={[styles.page, compact && compactStyles.page]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="automatic">
    <View style={styles.top}><View style={styles.identity}><Text style={styles.brand}>SMAC</Text><Text numberOfLines={1} style={styles.user}>{user.name} · {user.roles.filter(role => role !== 'anyone').join(' · ') || 'Helper'}</Text></View><Pressable hitSlop={10} onPress={onLogout}><Text style={styles.logout}>Log out</Text></Pressable></View>
    <View style={[styles.heading, compact && compactStyles.heading]}><Text style={styles.eyebrow}>ONE LAST STEP</Text><Text style={[styles.title, compact && compactStyles.title]}>Find your <Text style={styles.orange}>family crew.</Text></Text><Text style={styles.subtitle}>Hey {user.name.split(' ')[0]} — create a family or enter an existing crew code.</Text></View>
    <OffsetCard style={styles.cardWrap} contentStyle={[styles.card, compact && compactStyles.card]} offset={offset}>
      <Text style={styles.number}>01</Text><View style={styles.icon}><Text style={styles.iconText}>＋</Text></View><Text style={styles.cardTitle}>Create a family</Text><Text style={styles.cardText}>Start a new crew and invite everyone with a private code.</Text><Text style={styles.label}>FAMILY NAME</Text><TextInput value={name} onChangeText={setName} placeholder="The Morgan Crew" placeholderTextColor="rgba(21,40,32,.35)" style={styles.input} /><Action title="Create family" busy={busy === 'create'} onPress={() => act('create')} />
    </OffsetCard>
    <OffsetCard style={styles.cardWrap} contentStyle={[styles.card, styles.dark, compact && compactStyles.card]} shadowColor={theme.colors.orange} offset={offset}>
      <Text style={[styles.number, styles.white]}>02</Text><View style={styles.icon}><Text style={styles.iconText}>→</Text></View><Text style={[styles.cardTitle, styles.white]}>Join a family</Text><Text style={[styles.cardText, styles.darkMuted]}>Enter the six-character code from a family member.</Text><Text style={[styles.label, styles.white]}>FAMILY CODE</Text><TextInput value={code} onChangeText={value => setCode(value.toUpperCase().replace(/[^A-F0-9]/g, '').slice(0, 6))} autoCapitalize="characters" maxLength={6} placeholder="A1B2C3" placeholderTextColor="rgba(255,255,255,.3)" style={[styles.input, styles.darkInput]} /><Action title="Join family" busy={busy === 'join'} light onPress={() => act('join')} />
    </OffsetCard>
    {!!error && <Text style={styles.error}>{error}</Text>}<Text style={styles.note}>Expo Go prototype: family codes currently connect accounts stored on this device.</Text>
  </ScrollView></SafeAreaView>;
}

function Action({ title, busy, light, onPress }: { title: string; busy: boolean; light?: boolean; onPress: () => void }) {
  return <Pressable disabled={busy} onPress={onPress} style={[styles.button, light && styles.lightButton]}>{busy ? <ActivityIndicator color={light ? theme.colors.ink : 'white'} /> : <><Text style={[styles.buttonText, light && styles.darkText]}>{title}</Text><View style={styles.arrow}><Text>↗</Text></View></>}</Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.paper }, page: { width: '100%', maxWidth: 540, alignSelf: 'center', padding: 20, paddingBottom: 50 }, top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, gap: 12 }, identity: { flex: 1 },
  brand: { fontSize: 18, fontWeight: '900', letterSpacing: 1.5, color: theme.colors.ink }, user: { fontSize: 10, textTransform: 'capitalize', color: theme.colors.muted, marginTop: 2 }, logout: { fontSize: 12, fontWeight: '800', color: theme.colors.ink },
  heading: { alignItems: 'center', paddingVertical: 38 }, eyebrow: { borderWidth: 1, borderColor: theme.colors.ink, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, title: { fontSize: 45, lineHeight: 47, textAlign: 'center', letterSpacing: -2, fontWeight: '900', color: theme.colors.ink, marginTop: 18 }, orange: { color: theme.colors.orange }, subtitle: { textAlign: 'center', fontSize: 15, lineHeight: 22, color: theme.colors.muted, marginTop: 12 },
  cardWrap: { marginBottom: 18 }, card: { position: 'relative', borderWidth: 1.5, borderColor: theme.colors.ink, borderRadius: 22, padding: 24, backgroundColor: theme.colors.white }, dark: { backgroundColor: theme.colors.ink }, number: { position: 'absolute', right: 22, top: 20, fontSize: 11, fontWeight: '900', opacity: .35 }, icon: { width: 50, height: 50, borderRadius: 25, backgroundColor: theme.colors.lime, alignItems: 'center', justifyContent: 'center' }, iconText: { fontSize: 25, color: theme.colors.ink },
  cardTitle: { fontSize: 25, fontWeight: '900', color: theme.colors.ink, marginTop: 18 }, cardText: { color: theme.colors.muted, lineHeight: 20, marginTop: 5, marginBottom: 18 }, label: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 7 }, input: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: 11, padding: 13, fontSize: 16, color: theme.colors.ink, backgroundColor: theme.colors.white }, darkInput: { borderColor: 'rgba(255,255,255,.24)', backgroundColor: 'rgba(255,255,255,.08)', color: 'white', fontWeight: '900', letterSpacing: 4, fontSize: 19 },
  button: { minHeight: 52, borderRadius: 26, backgroundColor: theme.colors.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 8, marginTop: 16 }, lightButton: { backgroundColor: 'white' }, buttonText: { color: 'white', fontWeight: '800' }, darkText: { color: theme.colors.ink }, arrow: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.lime, alignItems: 'center', justifyContent: 'center' }, white: { color: 'white' }, darkMuted: { color: 'rgba(255,255,255,.62)' }, error: { color: theme.colors.error, fontWeight: '800', textAlign: 'center', marginVertical: 4 }, note: { fontSize: 11, lineHeight: 16, color: theme.colors.muted, textAlign: 'center', marginTop: 10 },
});
const compactStyles = StyleSheet.create({ page: { paddingHorizontal: 14 }, heading: { paddingVertical: 28 }, title: { fontSize: 38, lineHeight: 40, letterSpacing: -1.6 }, card: { padding: 18 } });
