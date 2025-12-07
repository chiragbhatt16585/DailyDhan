import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { MobileAds } from 'react-native-google-mobile-ads';

import { RootNavigator } from './src/navigation/RootNavigator';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeProvider';
import { lightPaperTheme, darkPaperTheme } from './src/theme/theme';
import { useAppStore } from './src/store/useAppStore';
import { processDueRecurringTransactions } from './src/database';

function AppContent() {
  const { isDark } = useAppTheme();
  const { initializeCurrency, initializePremium } = useAppStore();

  const theme = isDark ? darkPaperTheme : lightPaperTheme;

  useEffect(() => {
    // Initialize currency preference on app start
    initializeCurrency();
    // Initialize premium status on app start
    initializePremium();
    
    // Process due recurring transactions on app start
    const processRecurring = async () => {
      try {
        await processDueRecurringTransactions();
      } catch (error) {
        // Silently fail - don't interrupt app startup
        console.warn('Failed to process recurring transactions on startup:', error);
      }
    };
    processRecurring();
  }, [initializeCurrency, initializePremium]);

  return (
    <PaperProvider theme={theme}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <NavigationContainer theme={theme}>
        <RootNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}

export default function App() {
  useEffect(() => {
    // Initialize Google AdMob
    MobileAds()
      .initialize()
      .then(adapterStatuses => {
        // eslint-disable-next-line no-console
        console.log('AdMob initialized', adapterStatuses);
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.error('AdMob initialization error:', error);
      });
  }, []);

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}


