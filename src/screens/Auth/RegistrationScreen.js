// src/screens/Auth/RegistrationScreen.js
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Alert, Linking } from 'react-native';
import { Text, Button, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../../config/supabase';
import { migrateAllDataToSupabase, hasMigratedData } from '../../database/migrateToSupabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MIGRATION_KEY = '@dailydhan_migration_complete';

export default function RegistrationScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        // User is already logged in, check if migration needed
        await handlePostLogin(session.user.id);
      } else {
        setCheckingAuth(false);
      }
    } catch (error) {
      console.warn('Error checking auth status:', error);
      setCheckingAuth(false);
    }
  };

  const handlePostLogin = async (userId) => {
    try {
      // Check if migration already completed
      const migrationComplete = await AsyncStorage.getItem(`${MIGRATION_KEY}_${userId}`);
      
      if (migrationComplete === 'true') {
        // Already migrated, go to main app
        navigation.replace('Main');
        return;
      }

      // Check if user has data in Supabase
      const hasData = await hasMigratedData(userId);
      
      if (hasData) {
        // Data already exists in Supabase, mark as migrated
        await AsyncStorage.setItem(`${MIGRATION_KEY}_${userId}`, 'true');
        navigation.replace('Main');
        return;
      }

      // Check if local data exists and needs migration
      setLoading(true);
      Alert.alert(
        'Migrate Your Data?',
        'We found local data on your device. Would you like to migrate it to the cloud?',
        [
          {
            text: 'Skip',
            style: 'cancel',
            onPress: async () => {
              await AsyncStorage.setItem(`${MIGRATION_KEY}_${userId}`, 'true');
              navigation.replace('Main');
              setLoading(false);
            },
          },
          {
            text: 'Migrate',
            onPress: async () => {
              try {
                const summary = await migrateAllDataToSupabase(userId);
                await AsyncStorage.setItem(`${MIGRATION_KEY}_${userId}`, 'true');
                
                Alert.alert(
                  'Migration Complete!',
                  `Successfully migrated:\n• ${summary.categories} categories\n• ${summary.wallets} wallets\n• ${summary.transactions} transactions\n• ${summary.budgets} budgets\n• ${summary.recurringTransactions} recurring transactions`,
                  [{ text: 'OK', onPress: () => navigation.replace('Main') }]
                );
              } catch (error) {
                console.error('Migration error:', error);
                Alert.alert(
                  'Migration Error',
                  'Some data may not have been migrated. You can try again later from settings.',
                  [{ text: 'OK', onPress: () => navigation.replace('Main') }]
                );
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Post-login error:', error);
      setLoading(false);
      navigation.replace('Main');
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      // Check if Supabase is configured
      const supabaseUrl = supabase.supabaseUrl || '';
      if (supabaseUrl.includes('YOUR_PROJECT_ID') || !supabaseUrl.includes('.supabase.co')) {
        Alert.alert(
          'Configuration Required',
          'Please configure Supabase first!\n\n1. Open src/config/supabase.js\n2. Add your Supabase URL and API key\n3. Rebuild the app\n\nSee SUPABASE_SETUP_GUIDE.md for instructions.',
          [{ text: 'OK' }]
        );
        return;
      }

      setLoading(true);
      console.log('🔵 Starting Google OAuth...');
      console.log('🔵 Supabase URL:', supabaseUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'dailydhan://auth/callback',
          skipBrowserRedirect: true, // We'll open it manually
        },
      });

      if (error) {
        console.error('❌ Google sign-in error:', error);
        Alert.alert('Sign In Error', error.message || 'Failed to start sign-in. Please check your Supabase configuration.');
        setLoading(false);
      } else if (data?.url) {
        // OAuth flow started - manually open browser
        console.log('✅ OAuth URL generated');
        console.log('🌐 Opening browser manually...');
        try {
          const canOpen = await Linking.canOpenURL(data.url);
          if (canOpen) {
            await Linking.openURL(data.url);
            console.log('✅ Browser opened successfully');
            // Keep loading state - user is now in browser
            // Loading will be set to false when deep link callback is received
          } else {
            console.error('❌ Cannot open URL:', data.url);
            Alert.alert('Error', 'Cannot open browser. Please check your device settings.');
            setLoading(false);
          }
        } catch (linkError) {
          console.error('❌ Error opening URL:', linkError);
          Alert.alert('Error', 'Failed to open browser. Please try again.');
          setLoading(false);
        }
      } else {
        console.warn('⚠️ No URL returned from OAuth');
        Alert.alert('Error', 'Failed to generate OAuth URL. Please check your Supabase configuration.');
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Unexpected error during Google sign-in:', err);
      Alert.alert(
        'Error',
        err.message || 'Failed to start sign-in process. Please check your Supabase configuration.'
      );
      setLoading(false);
    }
  };

  // Handle deep link callback from OAuth
  useEffect(() => {
    console.log('🔗 Setting up deep link listeners...');
    
    // Handle initial URL (if app was opened via deep link)
    const handleInitialURL = async () => {
      try {
        const url = await Linking.getInitialURL();
        console.log('🔗 Initial URL:', url);
        if (url) {
          handleDeepLink(url);
        }
      } catch (error) {
        console.warn('Error getting initial URL:', error);
      }
    };

    // Handle URL when app is already running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('🔗 URL event received:', url);
      handleDeepLink(url);
    });

    handleInitialURL();

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = async (url) => {
    console.log('🔗 Deep link received:', url);
    
    // Check if this is our OAuth callback
    if (url && url.includes('dailydhan://auth/callback')) {
      try {
        setLoading(true);
        
        // Supabase OAuth callback format: dailydhan://auth/callback#access_token=...&refresh_token=...
        // Parse the hash fragment
        const hashIndex = url.indexOf('#');
        if (hashIndex === -1) {
          console.warn('No hash fragment in callback URL');
          setLoading(false);
          return;
        }

        const hash = url.substring(hashIndex + 1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const error = params.get('error');
        const errorDescription = params.get('error_description');

        if (error) {
          console.error('OAuth error:', error, errorDescription);
          Alert.alert('Sign In Error', errorDescription || error);
          setLoading(false);
          return;
        }

        if (accessToken && refreshToken) {
          console.log('📝 Setting session with tokens...');
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error('❌ Error setting session:', sessionError);
            Alert.alert('Sign In Error', sessionError.message);
            setLoading(false);
          } else if (data?.user) {
            console.log('✅ User signed in successfully:', data.user.id);
            setLoading(false);
            await handlePostLogin(data.user.id);
          } else {
            console.warn('⚠️ No user data in session');
            setLoading(false);
          }
        } else {
          console.warn('⚠️ Missing tokens in callback URL');
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Error handling deep link:', error);
        Alert.alert('Error', 'Failed to process sign-in callback. Please try again.');
        setLoading(false);
      }
    }
  };

  // Listen for auth state changes (backup handler)
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      if (event === 'SIGNED_IN' && session?.user) {
        setLoading(false);
        await handlePostLogin(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (checkingAuth) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Optional: Add your app logo here */}
      {/* <Image source={require('../../logo.png')} style={styles.logo} /> */}

      <Text variant="headlineMedium" style={styles.title}>
        Welcome to DailyDhan
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Track your income and expenses with ease.{'\n'}
        Sign in with your Google account to get started.
      </Text>

      <View style={styles.spacer} />

      <Button
        mode="contained"
        icon="google"
        onPress={handleGoogleSignIn}
        disabled={loading}
        contentStyle={styles.buttonContent}
        style={styles.googleButton}
        labelStyle={styles.buttonLabel}
      >
        {loading ? 'Connecting...' : 'Continue with Google'}
      </Button>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" style={styles.loadingIndicator} />
          <Text style={styles.loadingText}>Please wait...</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text variant="bodySmall" style={styles.footerText}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: 96,
    height: 96,
    alignSelf: 'center',
    marginBottom: 24,
    resizeMode: 'contain',
  },
  title: {
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 8,
    color: '#1A1A1A',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666666',
    marginBottom: 32,
    lineHeight: 22,
  },
  spacer: {
    height: 24,
  },
  googleButton: {
    borderRadius: 8,
    backgroundColor: '#4285F4',
    elevation: 2,
  },
  buttonContent: {
    height: 52,
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  loadingIndicator: {
    marginBottom: 8,
  },
  loadingText: {
    color: '#666666',
    fontSize: 14,
  },
  footer: {
    marginTop: 48,
    paddingHorizontal: 16,
  },
  footerText: {
    textAlign: 'center',
    color: '#999999',
    fontSize: 12,
  },
});

