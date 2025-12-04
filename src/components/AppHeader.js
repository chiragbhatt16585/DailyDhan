import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Appbar, Text, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

export const AppHeader = ({ showBack = false, title, subtitle, onBackPress }) => {
  const navigation = useNavigation();
  const theme = useTheme();

  const handleSettingsPress = () => {
    // Try to navigate to Settings in current stack first
    // If not found, navigate to DashboardTab which contains Settings
    const parent = navigation.getParent();
    if (parent) {
      // Navigate to DashboardTab, then Settings
      parent.navigate('DashboardTab', { screen: 'Settings' });
    } else {
      // Fallback: try direct navigation
      navigation.navigate('Settings');
    }
  };

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <Appbar.Header
      mode="center-aligned"
      elevated
      style={[
        styles.header,
        { backgroundColor: theme.colors.primary },
      ]}
    >
      {showBack && (
        <Appbar.BackAction
          onPress={handleBackPress}
          color="#FFFFFF"
        />
      )}
      <View style={styles.appTitleContainer}>
        <Image source={require('../logo.png')} style={styles.appLogo} />
        <View>
          <Text
            variant="titleLarge"
            style={styles.appTitle}
          >
            {title || 'DailyDhan'}
          </Text>
          <Text
            variant="bodySmall"
            style={styles.appSubtitle}
            numberOfLines={1}
          >
            {subtitle || 'Track Today, Save for Tomorrow'}
          </Text>
        </View>
      </View>
      <Appbar.Action
        icon="cog"
        onPress={handleSettingsPress}
        color="#FFFFFF"
      />
    </Appbar.Header>
  );
};

const styles = StyleSheet.create({
  header: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  appTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
    gap: 10,
    flex: 1,
  },
  appLogo: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  appTitle: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  appSubtitle: {
    color: 'rgba(255,255,255,0.8)',
  },
});


