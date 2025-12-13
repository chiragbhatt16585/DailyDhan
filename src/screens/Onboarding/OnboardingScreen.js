import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

const OnboardingScreen = ({ navigation }) => {
  const theme = useTheme();

  const handleContinue = () => {
    navigation.replace('Main');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.onBackground }]}>
        Welcome to DailyDhan
      </Text>
      <Text style={[styles.text, { color: theme.colors.onSurfaceVariant }]}>
        Track your daily income and expenses, visualize insights, and stay on top of your money.
      </Text>

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
  cta: {
    marginTop: 'auto',
    marginBottom: 40,
  },
});


