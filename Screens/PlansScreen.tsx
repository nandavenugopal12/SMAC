import React, { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

interface PlansScreenProps { onBack: () => void; }
type Response = 'pending' | 'accepted' | 'change' | 'helping';

export const PlansScreen: React.FC<PlansScreenProps> = ({ onBack }) => {
  const [day, setDay] = useState('Fri');
  const [response, setResponse] = useState<Response>('pending');
  const copy = response === 'accepted' ? 'You’re in!' : response === 'change' ? 'Change suggested' : response === 'helping' ? 'You offered help' : '3 of 4 are in';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.back}>
            <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>TOGETHER NEXT</Text>
            <Text style={styles.title}>Family plans</Text>
          </View>
          <TouchableOpacity style={styles.new}>
            <Ionicons name="add" size={24} color={theme.colors.plansDark} />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
          {['Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((x, i) => (
            <TouchableOpacity key={x} onPress={() => setDay(x)} style={[styles.day, day === x && styles.dayActive]}>
              <Text style={[styles.dayName, day === x && styles.dayNameActive]}>{x}</Text>
              <Text style={[styles.dayNum, day === x && styles.dayNameActive]}>{9 + i}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.feature}>
          <View style={styles.sky}>
            <View style={styles.sun} />
            <View style={styles.cloud} />
            <View style={styles.water} />
            <View style={styles.land} />
          </View>

          <View style={styles.featureCopy}>
            <View style={styles.featureTop}>
              <Text style={styles.overline}>FRIDAY · 4:00 PM</Text>
              <View style={styles.agreed}>
                <Ionicons name="people" size={14} color={theme.colors.plansDark} />
                <Text style={styles.agreedText}>{copy}</Text>
              </View>
            </View>

            <Text style={styles.featureTitle}>Friday by the water</Text>
            <Text style={styles.place}>Creek Park · everyone’s invited</Text>

            <View style={styles.route}>
              <View style={styles.stop}>
                <View style={styles.stopIcon}><Ionicons name="basket-outline" size={17} color={theme.colors.mealsDark} /></View>
                <Text style={styles.stopText}>Snacks</Text>
              </View>
              <View style={styles.line} />
              <View style={styles.stop}>
                <View style={styles.stopIcon}><Ionicons name="walk-outline" size={17} color={theme.colors.transportDark} /></View>
                <Text style={styles.stopText}>Sunset</Text>
              </View>
              <View style={styles.line} />
              <View style={styles.stop}>
                <View style={styles.stopIcon}><Ionicons name="restaurant-outline" size={17} color={theme.colors.plansDark} /></View>
                <Text style={styles.stopText}>Dinner</Text>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity onPress={() => setResponse('accepted')} style={[styles.primary, response === 'accepted' && styles.success]}>
                <Ionicons name={response === 'accepted' ? 'checkmark' : 'heart-outline'} size={17} color="#FFF" />
                <Text style={styles.primaryText}>{response === 'accepted' ? 'Accepted' : 'I’m in'}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setResponse('change')} style={styles.secondary}>
                <Text style={styles.secondaryText}>Suggest</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setResponse('helping')} style={styles.secondary}>
                <Text style={styles.secondaryText}>Help</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.section}>Coming up</Text>
          <Text style={styles.count}>2 shared moments</Text>
        </View>

        <TouchableOpacity style={[styles.smallCard, { backgroundColor: theme.colors.school }]}>
          <View style={styles.smallIcon}><Ionicons name="flask-outline" size={22} color={theme.colors.schoolDark} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.smallOverline}>SCHOOL · THU 17</Text>
            <Text style={styles.smallTitle}>Science fair finish line</Text>
            <Text style={styles.smallSub}>Noor asked for a second pair of eyes</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color={theme.colors.schoolDark} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.smallCard, { backgroundColor: theme.colors.meals }]}>
          <View style={styles.smallIcon}><Ionicons name="restaurant-outline" size={22} color={theme.colors.mealsDark} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.smallOverline}>MEALS · SAT 19</Text>
            <Text style={styles.smallTitle}>Cook something new</Text>
            <Text style={styles.smallSub}>Three recipes waiting for your vote</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color={theme.colors.mealsDark} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 18, paddingBottom: 40, maxWidth: 520, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  back: { width: 42, height: 42, borderRadius: 16, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
  new: { width: 42, height: 42, borderRadius: 16, backgroundColor: theme.colors.plans, alignItems: 'center', justifyContent: 'center' },
  kicker: { fontSize: 9, fontWeight: '900', letterSpacing: 1.2, color: theme.colors.textMuted },
  title: { fontSize: 28, fontWeight: '900', letterSpacing: -1, color: theme.colors.textPrimary },
  days: { paddingBottom: 18 },
  day: { width: 58, height: 65, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
  dayActive: { backgroundColor: theme.colors.textPrimary },
  dayName: { fontSize: 10, fontWeight: '700', color: theme.colors.textMuted },
  dayNum: { fontSize: 18, fontWeight: '900', color: theme.colors.textPrimary, marginTop: 2 },
  dayNameActive: { color: '#FFF' },

  feature: { borderRadius: 30, overflow: 'hidden', backgroundColor: '#FFF', borderWidth: 1, borderColor: theme.colors.border, ...theme.shadows.soft },
  sky: { height: 150, backgroundColor: theme.colors.transport, overflow: 'hidden' },
  sun: { position: 'absolute', width: 72, height: 72, borderRadius: 36, backgroundColor: theme.colors.connection, right: 30, top: 22 },
  cloud: { position: 'absolute', width: 90, height: 28, borderRadius: 20, backgroundColor: 'rgba(255,255,255,.75)', left: 28, top: 34 },
  water: { position: 'absolute', height: 65, left: 0, right: 0, bottom: 0, backgroundColor: '#A9D9F4' },
  land: { position: 'absolute', width: 260, height: 90, borderRadius: 100, backgroundColor: theme.colors.plans, bottom: -54, left: -30, transform: [{ rotate: '-5deg' }] },
  featureCopy: { padding: 18 },
  featureTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  overline: { fontSize: 9, fontWeight: '900', letterSpacing: 1.1, color: theme.colors.plansDark },
  agreed: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.plans, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 14 },
  agreedText: { fontSize: 10, fontWeight: '800', color: theme.colors.plansDark },
  featureTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.7, color: theme.colors.textPrimary, marginTop: 7 },
  place: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
  route: { flexDirection: 'row', alignItems: 'flex-start', marginVertical: 22 },
  stop: { alignItems: 'center' },
  stopIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  stopText: { fontSize: 10, fontWeight: '700', color: theme.colors.textSecondary, marginTop: 5 },
  line: { flex: 1, height: 2, backgroundColor: theme.colors.border, marginTop: 20 },
  actions: { flexDirection: 'row' },
  primary: { flex: 1, minHeight: 46, borderRadius: 23, backgroundColor: theme.colors.textPrimary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  success: { backgroundColor: theme.colors.plansDark },
  primaryText: { color: '#FFF', fontWeight: '800' },
  secondary: { minWidth: 82, minHeight: 46, borderRadius: 23, backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontSize: 12, fontWeight: '800', color: theme.colors.textPrimary },
  sectionRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 },
  section: { fontSize: 18, fontWeight: '900', color: theme.colors.textPrimary },
  count: { fontSize: 10, color: theme.colors.textMuted },
  smallCard: { minHeight: 108, borderRadius: 24, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  smallIcon: { width: 48, height: 48, borderRadius: 17, backgroundColor: 'rgba(255,255,255,.65)', alignItems: 'center', justifyContent: 'center' },
  smallOverline: { fontSize: 8, fontWeight: '900', letterSpacing: 1, color: theme.colors.textSecondary },
  smallTitle: { fontSize: 15, fontWeight: '900', color: theme.colors.textPrimary, marginTop: 3 },
  smallSub: { fontSize: 11, color: theme.colors.textSecondary, marginTop: 3 },
});
