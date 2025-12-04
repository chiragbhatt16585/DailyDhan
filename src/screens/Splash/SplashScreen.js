import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const timeout = setTimeout(() => {
      navigation.replace('Dashboard');
    }, 1200);

    return () => clearTimeout(timeout);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>
        DailyDhan
      </Text>
      <Text variant="titleMedium" style={styles.tagline}>
        Track Today, Save for Tomorrow
      </Text>
      <ActivityIndicator style={styles.spinner} color="#F4B400" />
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E4E7C',
  },
  title: {
    color: 'white',
    fontWeight: '700',
    marginBottom: 8,
  },
  tagline: {
    color: 'white',
  },
  spinner: {
    marginTop: 24,
  },
});


