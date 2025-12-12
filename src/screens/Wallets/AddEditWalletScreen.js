import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Button,
  Text,
  TextInput,
  useTheme,
  IconButton,
} from 'react-native-paper';
import { AppHeader } from '../../components/AppHeader';
import { getDB } from '../../database';

const AddEditWalletScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const wallet = route.params?.wallet || null;
  const isEditing = !!wallet;
  
  const [walletType, setWalletType] = useState(wallet?.type || 'cash');
  const [walletName, setWalletName] = useState(wallet?.name || '');
  const [bankName, setBankName] = useState(wallet?.bank_name || '');
  const [last4Digits, setLast4Digits] = useState(wallet?.last_4_digits || '');

  const getWalletNamePlaceholder = (type) => {
    switch (type) {
      case 'cash': return 'e.g. Cash, Wallet';
      case 'bank': return 'e.g. Savings Account, Current Account';
      case 'upi': return 'e.g. PhonePe, Google Pay, Paytm';
      case 'credit_card': return 'e.g. HDFC Credit Card, SBI Credit Card';
      default: return 'Wallet Name';
    }
  };

  const handleSave = async () => {
    if (!walletName.trim()) {
      Alert.alert('Error', 'Please enter a wallet name');
      return;
    }

    try {
      const db = await getDB();
      
      if (isEditing) {
        await db.executeSql(
          'UPDATE wallets SET name = ?, type = ?, bank_name = ?, last_4_digits = ? WHERE id = ?',
          [
            walletName.trim(),
            walletType,
            walletType === 'bank' || walletType === 'credit_card' ? bankName.trim() : null,
            walletType === 'credit_card' ? last4Digits.trim() : null,
            wallet.id,
          ],
        );
      } else {
        await db.executeSql(
          'INSERT INTO wallets (name, type, bank_name, last_4_digits) VALUES (?, ?, ?, ?)',
          [
            walletName.trim(),
            walletType,
            walletType === 'bank' || walletType === 'credit_card' ? bankName.trim() : null,
            walletType === 'credit_card' ? last4Digits.trim() : null,
          ],
        );
      }
      
      navigation.goBack();
    } catch (e) {
      console.warn('Failed to save wallet', e);
      Alert.alert('Error', 'Failed to save wallet. Please try again.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Wallet',
      `Are you sure you want to delete "${wallet.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await getDB();
              await db.executeSql('DELETE FROM wallets WHERE id = ?', [wallet.id]);
              navigation.goBack();
            } catch (e) {
              console.warn('Failed to delete wallet', e);
              Alert.alert('Error', 'Failed to delete wallet. Please try again.');
            }
          },
        },
      ],
    );
  };

  const walletTypes = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank', label: 'Bank' },
    { value: 'upi', label: 'UPI' },
    { value: 'credit_card', label: 'Credit Card' },
  ];

  return (
    <>
      <AppHeader showBack title={isEditing ? 'Edit Wallet' : 'Add New Wallet'} />
      <KeyboardAvoidingView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <Text variant="bodyMedium" style={[styles.label, { color: theme.colors.onSurface }]}>
            Wallet Type
          </Text>
          <View style={styles.typeContainer}>
            {walletTypes.map(type => (
              <Button
                key={type.value}
                mode={walletType === type.value ? 'contained' : 'outlined'}
                onPress={() => setWalletType(type.value)}
                style={styles.typeButton}
              >
                {type.label}
              </Button>
            ))}
          </View>

          <TextInput
            mode="outlined"
            label="Wallet Name"
            value={walletName}
            onChangeText={setWalletName}
            placeholder={getWalletNamePlaceholder(walletType)}
            style={styles.input}
            outlineColor="#E0E0E0"
            activeOutlineColor={theme.colors.primary}
            autoCorrect={false}
            autoCapitalize="words"
            textContentType="none"
          />

          {(walletType === 'bank' || walletType === 'credit_card') && (
            <TextInput
              mode="outlined"
              label="Bank Name"
              value={bankName}
              onChangeText={setBankName}
              placeholder="e.g. HDFC Bank, SBI, ICICI"
              style={styles.input}
              outlineColor="#E0E0E0"
              activeOutlineColor={theme.colors.primary}
              autoCorrect={false}
              autoCapitalize="words"
              textContentType="none"
            />
          )}

          {walletType === 'credit_card' && (
            <TextInput
              mode="outlined"
              label="Last 4 Digits"
              value={last4Digits}
              onChangeText={(text) => {
                if (text.length <= 4 && /^\d*$/.test(text)) {
                  setLast4Digits(text);
                }
              }}
              placeholder="1234"
              keyboardType="numeric"
              maxLength={4}
              style={styles.input}
              outlineColor="#E0E0E0"
              activeOutlineColor={theme.colors.primary}
              autoCorrect={false}
              autoCapitalize="none"
              textContentType="none"
            />
          )}

          <View style={styles.actions}>
            {isEditing && (
              <Button
                mode="text"
                textColor="#E91E63"
                onPress={handleDelete}
                style={styles.deleteButton}
              >
                Delete
              </Button>
            )}
            <Button
              mode="contained"
              onPress={handleSave}
              disabled={!walletName.trim()}
              style={styles.saveButton}
            >
              {isEditing ? 'Update' : 'Save'}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

export default AddEditWalletScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  label: {
    marginBottom: 12,
    fontWeight: '600',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    minWidth: '45%',
  },
  input: {
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
    gap: 12,
  },
  deleteButton: {
    minWidth: 80,
  },
  saveButton: {
    minWidth: 80,
  },
});

