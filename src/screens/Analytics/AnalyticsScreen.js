import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { AppHeader } from '../../components/AppHeader';

const AnalyticsScreen = ({ navigation }) => {
  return (
    <>
      <AppHeader showBack title="Analytics & Reports" />
      <View style={styles.container}>
        <Text>Charts and monthly comparisons will be shown here.</Text>
      </View>
    </>
  );
};

export default AnalyticsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});


