import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';

import CleanlinessScreen from './Screens/CleanlinessScreen';
import { CreateTaskScreen } from './Screens/CreateTaskScreen';
import { DashboardScreen } from './Screens/DashboardScreen';
import { DriveTaskScreen } from './Screens/DriveTaskScreen';
import { FamilyScreen } from './Screens/FamilyScreen';
import FoodScreen from './Screens/FoodScreen';
import Homepage from './Screens/Homepage';
import { LoginScreen } from './Screens/LoginScreen';
import PlanningScreen from './Screens/PlanningScreen';
import { QuestDetailScreen } from './Screens/QuestDetailScreen';
import TransportScreen from './Screens/TransportScreen';
import { getCurrentUser, getFamilyForUser, initializeDatabase, logout } from './services/database';
import type { Family, QuestSubtask, User } from './types';
import { theme } from './theme';

type Screen =
  | 'login'
  | 'family'
  | 'home'
  | 'dashboard'
  | 'food'
  | 'transport'
  | 'planning'
  | 'cleanliness'
  | 'createTask'
  | 'questDetail'
  | 'driveTask';

type DriveContext = { task: QuestSubtask; acceptedAt: string };

export default function App() {
  return (
    <SQLiteProvider databaseName="homequest.db" onInit={initializeDatabase}>
      <HomeQuestApp />
    </SQLiteProvider>
  );
}

function HomeQuestApp() {
  const db = useSQLiteContext();
  const [screen, setScreen] = useState<Screen>('login');
  const [user, setUser] = useState<User | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [questId, setQuestId] = useState<number | null>(null);
  const [drive, setDrive] = useState<DriveContext | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const refreshSession = useCallback(async () => {
    const nextUser = await getCurrentUser(db);
    setUser(nextUser);
    if (!nextUser) {
      setFamily(null);
      setScreen('login');
      return;
    }
    const nextFamily = await getFamilyForUser(db, nextUser.id);
    setFamily(nextFamily);
    setScreen(nextFamily ? 'home' : 'family');
  }, [db]);

  const signOut = useCallback(async () => {
    await logout(db);
    setUser(null);
    setFamily(null);
    setQuestId(null);
    setDrive(null);
    setScreen('login');
  }, [db]);

  const changed = () => setRefreshToken(value => value + 1);
  const openQuest = (id: number) => {
    setQuestId(id);
    setScreen('questDetail');
  };
  const startDrive = (task: QuestSubtask, acceptedAt: string) => {
    setDrive({ task, acceptedAt });
    setScreen('driveTask');
  };

  if (screen === 'login') return <LoginScreen onAuthenticated={refreshSession} />;
  if (!user) return <View style={styles.loading}><ActivityIndicator color={theme.colors.orange} /></View>;
  if (screen === 'family' || !family) return <FamilyScreen user={user} onFamilyReady={refreshSession} onLogout={signOut} />;

  if (screen === 'food') return <FoodScreen onBack={() => setScreen('home')} />;
  if (screen === 'transport') return <TransportScreen onBack={() => setScreen('home')} />;
  if (screen === 'planning') return <PlanningScreen onBack={() => setScreen('home')} />;
  if (screen === 'cleanliness') return <CleanlinessScreen onBack={() => setScreen('home')} />;
  if (screen === 'createTask') return <CreateTaskScreen user={user} family={family} onBack={() => setScreen('home')} onCommitted={() => { changed(); setScreen('dashboard'); }} />;
  if (screen === 'dashboard') return <DashboardScreen user={user} family={family} refreshToken={refreshToken} onCreateTask={() => setScreen('createTask')} onOpenQuest={openQuest} onLogout={signOut} />;
  if (screen === 'questDetail' && questId !== null) return <QuestDetailScreen questId={questId} user={user} family={family} onBack={() => setScreen('dashboard')} onChanged={changed} onStartDrive={startDrive} />;
  if (screen === 'driveTask' && drive) return <DriveTaskScreen task={drive.task} acceptedAt={drive.acceptedAt} user={user} onBack={() => setScreen('questDetail')} onCompleted={() => { changed(); setDrive(null); setScreen('questDetail'); }} />;

  return <Homepage
    onNavigateToFood={() => setScreen('food')}
    onNavigateToTransport={() => setScreen('transport')}
    onNavigateToPlanning={() => setScreen('planning')}
    onNavigateToCleanliness={() => setScreen('cleanliness')}
    onNavigateToPlans={() => setScreen('planning')}
    onCreateTask={() => setScreen('createTask')}
    onOpenTasks={() => setScreen('dashboard')}
  />;
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.paper } });
