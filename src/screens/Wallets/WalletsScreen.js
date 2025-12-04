import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { AppHeader } from '../../components/AppHeader';

const WalletsScreen = ({ navigation }) => {
  return (
    <>
      <AppHeader showBack title="Wallets" />
      <View style={styles.container}>
        <Text>Wallet accounts and balances will be managed here.</Text>
      </View>
    </>
  );
};

export default WalletsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});


