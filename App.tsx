import React, { useState } from 'react';
import { LoginScreen } from './Screens/LoginScreen';
import { HomeScreen } from './Screens/HomeScreen';
import { PlansScreen } from './Screens/PlansScreen';

export default function App() {
  const [screen, setScreen] = useState<'login' | 'home' | 'plans'>('login');

  if (screen === 'login') {
    return <LoginScreen onLogin={() => setScreen('home')} />;
  }

  if (screen === 'plans') {
    return <PlansScreen onBack={() => setScreen('home')} />;
  }

  return <HomeScreen onNavigateToPlans={() => setScreen('plans')} />;
}
