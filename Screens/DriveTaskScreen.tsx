import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSQLiteContext } from 'expo-sqlite';
import { completeSubtask } from '../services/database';
import { distanceInMetres, geocodeDestination, type Coordinates } from '../services/maps';
import type { QuestSubtask, User } from '../types';
import { theme } from '../theme';

const parseDatabaseDate = (value: string) => new Date(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`).getTime();
const formatTime = (startedAt: string, now: number) => {
  const seconds = Math.max(0, Math.floor((now - parseDatabaseDate(startedAt)) / 1000));
  const minutes = Math.floor(seconds / 60);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
};

export function DriveTaskScreen({ task, acceptedAt, user, onBack, onCompleted }: { task: QuestSubtask; acceptedAt: string; user: User; onBack: () => void; onCompleted: () => void }) {
  const db = useSQLiteContext();
  const map = useRef<MapView>(null);
  const completing = useRef(false);
  const [destination, setDestination] = useState<Coordinates | null>(null);
  const [position, setPosition] = useState<Coordinates | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [status, setStatus] = useState('Finding destination…');
  const [error, setError] = useState('');

  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    let subscription: Location.LocationSubscription | undefined;
    let cancelled = false;
    const start = async () => {
      try {
        const target = await geocodeDestination(task.destination || '');
        if (cancelled) return;
        setDestination(target); setStatus('Requesting location access…');
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') throw new Error('Location access is required to track a drive task.');
        const first = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const initial = { latitude: first.coords.latitude, longitude: first.coords.longitude };
        if (cancelled) return;
        const initialDistance = distanceInMetres(initial, target);
        setPosition(initial); setDistance(initialDistance); setStatus('Tracking your trip');
        map.current?.fitToCoordinates([initial, target], { edgePadding: { top: 70, right: 50, bottom: 70, left: 50 }, animated: true });
        if (initialDistance <= 100) {
          completing.current = true; setStatus('Destination reached — completing task…');
          await completeSubtask(db, task.id, user.id); onCompleted(); return;
        }
        subscription = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval: 10, timeInterval: 3000 }, async update => {
          const current = { latitude: update.coords.latitude, longitude: update.coords.longitude };
          const remaining = distanceInMetres(current, target);
          setPosition(current); setDistance(remaining);
          if (remaining <= 100 && !completing.current) {
            completing.current = true; setStatus('Destination reached — completing task…');
            try { await completeSubtask(db, task.id, user.id); subscription?.remove(); onCompleted(); }
            catch (caught) { completing.current = false; setError(caught instanceof Error ? caught.message : 'Could not complete the task.'); }
          }
        });
      } catch (caught) { if (!cancelled) setError(caught instanceof Error ? caught.message : 'Could not start location tracking.'); }
    };
    start();
    return () => { cancelled = true; subscription?.remove(); };
  }, [db, task.destination, task.id, user.id, onCompleted]);

  const openDirections = () => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(task.destination || '')}`);
  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <View style={styles.topbar}><Pressable hitSlop={10} onPress={onBack}><Text style={styles.back}>← Task list</Text></Pressable><Text style={styles.topTitle}>LIVE DRIVE</Text><View style={styles.spacer} /></View>
    <View style={styles.mapWrap}>{destination ? <MapView ref={map} provider={PROVIDER_GOOGLE} style={styles.map} showsUserLocation followsUserLocation initialRegion={{ ...destination, latitudeDelta: .04, longitudeDelta: .04 }}><Marker coordinate={destination} title="Destination" description={task.destination} pinColor={theme.colors.orange} />{position && <><Marker coordinate={position} title={user.name} /><Polyline coordinates={[position, destination]} strokeColor={theme.colors.orange} strokeWidth={4} lineDashPattern={[8, 5]} /></>}</MapView> : <ActivityIndicator style={styles.loader} color={theme.colors.orange} />}</View>
    <View style={styles.panel}><View style={styles.livePill}><View style={styles.dot} /><Text style={styles.liveText}>LIVE · {formatTime(acceptedAt, now)}</Text></View><Text style={styles.title}>{task.title}</Text><Text style={styles.destination}>⌖ {task.destination}</Text><View style={styles.tripRow}><View><Text style={styles.metricLabel}>DISTANCE LEFT</Text><Text style={styles.metric}>{distance === null ? '—' : distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`}</Text></View><Text style={styles.status}>{status}</Text></View>{!!error && <Text style={styles.error}>{error}</Text>}<Pressable onPress={openDirections} style={styles.directions}><Text style={styles.directionsText}>Open turn-by-turn directions</Text><Text style={styles.directionsArrow}>↗</Text></Pressable><Text style={styles.note}>Keep this screen open. The task completes automatically within 100 m of the destination.</Text></View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.colors.paper }, topbar: { minHeight: 58, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: theme.colors.border }, back: { color: theme.colors.ink, fontSize: 12, fontWeight: '800' }, topTitle: { color: theme.colors.ink, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, spacer: { width: 56 }, mapWrap: { flex: 1, minHeight: 280, backgroundColor: theme.colors.mint }, map: { width: '100%', height: '100%' }, loader: { flex: 1 },
  panel: { padding: 18, paddingBottom: 10, borderTopWidth: 2, borderTopColor: theme.colors.ink, backgroundColor: theme.colors.paper }, livePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 99, backgroundColor: theme.colors.lime }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.orange }, liveText: { color: theme.colors.ink, fontSize: 8, fontWeight: '900', letterSpacing: .7, fontVariant: ['tabular-nums'] }, title: { marginTop: 11, color: theme.colors.ink, fontSize: 22, lineHeight: 26, fontWeight: '900' }, destination: { marginTop: 4, color: theme.colors.muted, fontSize: 11 },
  tripRow: { marginTop: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }, metricLabel: { color: theme.colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: .8 }, metric: { marginTop: 2, color: theme.colors.orange, fontSize: 24, fontWeight: '900' }, status: { flex: 1, color: theme.colors.muted, fontSize: 10, textAlign: 'right' }, error: { marginTop: 10, color: theme.colors.error, fontSize: 11, fontWeight: '800' }, directions: { minHeight: 48, marginTop: 14, borderRadius: 24, paddingHorizontal: 17, backgroundColor: theme.colors.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, directionsText: { color: theme.colors.white, fontSize: 11, fontWeight: '900' }, directionsArrow: { color: theme.colors.lime, fontSize: 18 }, note: { marginTop: 9, color: theme.colors.muted, fontSize: 9, lineHeight: 13, textAlign: 'center' },
});
