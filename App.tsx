import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LoginScreen } from './Screens/LoginScreen';
import { FamilyScreen } from './Screens/FamilyScreen';
import { CreateTaskScreen } from './Screens/CreateTaskScreen';
import { DashboardScreen } from './Screens/DashboardScreen';
import { DriveTaskScreen } from './Screens/DriveTaskScreen';
import { QuestDetailScreen } from './Screens/QuestDetailScreen';
import { getCurrentUser, getFamilyForUser, initializeDatabase, logout } from './services/database';
import type { Family, QuestSubtask, User } from './types';
import { theme } from './theme';

function AppContent() {
  const db = useSQLiteContext();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [screen, setScreen] = useState<'dashboard' | 'create' | 'quest' | 'drive'>('dashboard');
  const [selectedQuestId, setSelectedQuestId] = useState<number | null>(null);
  const [driveTask, setDriveTask] = useState<{ task: QuestSubtask; acceptedAt: string } | null>(null);
  const [dashboardRefresh, setDashboardRefresh] = useState(0);
  const refreshSession = useCallback(async () => { const activeUser = await getCurrentUser(db); setUser(activeUser); setFamily(activeUser ? await getFamilyForUser(db, activeUser.id) : null); setLoading(false); }, [db]);
  const handleLogout = useCallback(async () => {
    await logout(db);
    setScreen('dashboard');
    await refreshSession();
  }, [db, refreshSession]);
  useEffect(() => { refreshSession().catch(() => setLoading(false)); }, [refreshSession]);
  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color={theme.colors.orange} /><Text style={styles.loadingText}>Loading your crew…</Text></View>;
  if (!user) return <LoginScreen onAuthenticated={refreshSession} />;
  if (!family) return <FamilyScreen user={user} onFamilyReady={refreshSession} onLogout={handleLogout} />;
  if (screen === 'create') {
    return (
      <CreateTaskScreen
        user={user}
        family={family}
        onBack={() => setScreen('dashboard')}
        onCommitted={() => {
          setDashboardRefresh((value) => value + 1);
          setScreen('dashboard');
        }}
      />
    );
  }
  if (screen === 'drive' && driveTask && selectedQuestId) {
    return <DriveTaskScreen task={driveTask.task} acceptedAt={driveTask.acceptedAt} user={user} onBack={() => setScreen('quest')} onCompleted={() => { setDashboardRefresh(value => value + 1); setScreen('quest'); }} />;
  }
  if (screen === 'quest' && selectedQuestId) {
    return <QuestDetailScreen questId={selectedQuestId} user={user} family={family} onBack={() => setScreen('dashboard')} onChanged={() => setDashboardRefresh(value => value + 1)} onStartDrive={(task, acceptedAt) => { setDriveTask({ task, acceptedAt }); setScreen('drive'); }} />;
  }
  return (
    <DashboardScreen
      user={user}
      family={family}
      refreshToken={dashboardRefresh}
      onCreateTask={() => setScreen('create')}
      onOpenQuest={(questId) => { setSelectedQuestId(questId); setScreen('quest'); }}
      onLogout={handleLogout}
    />
  );
}
export default function App() { return <SafeAreaProvider><SQLiteProvider databaseName="smac.db" onInit={initializeDatabase}><StatusBar style="dark" /><AppContent /></SQLiteProvider></SafeAreaProvider>; }
const styles = StyleSheet.create({ loading:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#F4F1E8'}, loadingText:{marginTop:14,color:'rgba(21,40,32,.62)',fontWeight:'700'} });
