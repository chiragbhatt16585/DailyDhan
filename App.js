import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { MobileAds } from 'react-native-google-mobile-ads';

import { RootNavigator } from './src/navigation/RootNavigator';
import { ThemeProvider, useAppTheme } from './src/theme/ThemeProvider';
import { lightPaperTheme, darkPaperTheme } from './src/theme/theme';
import { useAppStore } from './src/store/useAppStore';

function AppContent() {
  const { isDark } = useAppTheme();
  const { initializeCurrency } = useAppStore();

  const theme = isDark ? darkPaperTheme : lightPaperTheme;

  useEffect(() => {
    // Initialize currency preference on app start
    initializeCurrency();
  }, [initializeCurrency]);

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


