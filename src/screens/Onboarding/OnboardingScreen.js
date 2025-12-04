import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeProvider';

const OnboardingScreen = ({ navigation }) => {
  const { isDark, toggleTheme } = useAppTheme();

  const handleContinue = () => {
    navigation.replace('Dashboard');
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Welcome to DailyDhan
      </Text>
      <Text style={styles.text}>
        Track your daily income and expenses, visualize insights, and stay on top of your money.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardText}>Choose your theme</Text>
        <Button mode="outlined" onPress={toggleTheme}>
          Switch to {isDark ? 'Light' : 'Dark'} Mode
        </Button>
      </View>

      <Button mode="contained" onPress={handleContinue} style={styles.cta}>
        Get Started
      </Button>
    </View>
  );
};

export default OnboardingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  title: {
    marginBottom: 16,
  },
  text: {
    marginBottom: 32,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 32,
  },
  cardText: {
    marginBottom: 12,
  },
  cta: {
    marginTop: 'auto',
    marginBottom: 40,
  },
});


