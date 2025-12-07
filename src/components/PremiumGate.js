import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Button, Text, Icon, useTheme } from 'react-native-paper';
import { useAppStore } from '../store/useAppStore';
import { ENABLE_PREMIUM_FEATURES } from '../config/premium';

/**
 * PremiumGate Component
 * 
 * Use this component to gate premium features.
 * If user is not premium, shows upgrade prompt.
 * If user is premium, shows children.
 * 
 * Example usage:
 * <PremiumGate featureName="Budget Management" navigation={navigation}>
 *   <YourPremiumFeature />
 * </PremiumGate>
 */
export const PremiumGate = ({ 
  children, 
  featureName = 'This feature',
  navigation,
  showUpgradeButton = true,
}) => {
  const theme = useTheme();
  const { isPremium } = useAppStore();

  // If premium features are disabled, always show children
  if (!ENABLE_PREMIUM_FEATURES) {
    return <>{children}</>;
  }

  if (isPremium) {
    return <>{children}</>;
  }

  const handleUpgrade = () => {
    if (navigation) {
      navigation.navigate('Premium');
    }
  };

  return (
    <View style={styles.container}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
        <Card.Content style={styles.content}>
          <Icon source="crown" size={48} color="#FFD700" />
          <Text 
            variant="titleLarge" 
            style={[styles.title, { color: theme.colors.onSurface }]}
          >
            Premium Feature
          </Text>
          <Text 
            variant="bodyMedium" 
            style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
          >
            {featureName} is available in DailyDhan Premium. Upgrade to unlock all premium features and get the most out of your financial tracking.
          </Text>
          {showUpgradeButton && (
            <Button
              mode="contained"
              onPress={handleUpgrade}
              style={styles.button}
              icon="crown"
            >
              Upgrade to Premium
            </Button>
          )}
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 400,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  title: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    marginTop: 8,
  },
});

/**
 * Hook to check premium status
 * 
 * Example usage:
 * const { isPremium, requirePremium } = usePremium();
 * 
 * if (!isPremium) {
 *   requirePremium('Budget Management');
 *   return null;
 * }
 */
export const usePremium = () => {
  const { isPremium } = useAppStore();
  // If premium features are disabled, always return true
  const effectiveIsPremium = !ENABLE_PREMIUM_FEATURES || isPremium;

  const requirePremium = (featureName, navigation) => {
    if (!effectiveIsPremium && navigation) {
      navigation.navigate('Premium');
    }
  };

  return { isPremium: effectiveIsPremium, requirePremium };
};

