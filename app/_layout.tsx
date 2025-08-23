// app/_layout.tsx
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Purchases from 'react-native-purchases';
import { configureRevenueCat } from '../utils/revenueCat';
import { PetProvider } from './hooks/PetContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'PressStart2P': require('../assets/fonts/PressStart2P-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      // Initialize RevenueCat
      configureRevenueCat();
      
      // Set debug logs (remove in production)
      Purchases.setDebugLogsEnabled(true);
      
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <PetProvider>
      <View style={styles.container}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </PetProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
});