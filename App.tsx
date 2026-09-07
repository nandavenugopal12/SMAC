import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { HomeScreen } from './Screens/HomeScreen';
import { PlansScreen } from './Screens/PlansScreen';

type Screen = 'home' | 'plans';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  return (
    <View style={styles.container}>
      {currentScreen === 'home' && <HomeScreen onNavigateToPlans={() => setCurrentScreen('plans')} />}
      {currentScreen === 'plans' && <PlansScreen onBack={() => setCurrentScreen('home')} />}
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
