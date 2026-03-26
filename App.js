import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/AuthContext';
import { LeaveCountProvider } from './src/context/LeaveCountContext';
import Navigation from './src/navigation';

export default function App() {
  return (
    <SafeAreaProvider>
        <AuthProvider>
      <LeaveCountProvider>
          <Navigation />
          <StatusBar style="auto" />
      </LeaveCountProvider>
        </AuthProvider>
    </SafeAreaProvider>
  );
}
