import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert } from 'react-native';
import {
  Button,
  Card,
  List,
  Portal,
  Modal,
  Text,
  TextInput,
  useTheme,
  IconButton,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getDB } from '../../database';
import { AppHeader } from '../../components/AppHeader';

const WalletsScreen = ({ navigation }) => {
  const theme = useTheme();
  const isMountedRef = useRef(true);
  const [wallets, setWallets] = useState([]);
  const [addWalletModalVisible, setAddWalletModalVisible] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [newWalletType, setNewWalletType] = useState('cash');
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletBankName, setNewWalletBankName] = useState('');
  const [newWalletLast4Digits, setNewWalletLast4Digits] = useState('');

  const loadWallets = async () => {
    if (!isMountedRef.current) return;
    
    try {
      const db = await getDB();
      const [result] = await db.executeSql(
        'SELECT id, name, type, bank_name, last_4_digits FROM wallets ORDER BY name ASC',
      );
      const rows = [];
      for (let i = 0; i < result.rows.length; i += 1) {
        rows.push(result.rows.item(i));
      }
      
      if (isMountedRef.current) {
        setWallets(rows);
      }
    } catch (e) {
      console.warn('Failed to load wallets', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      isMountedRef.current = true;
      loadWallets();
      return () => {
        isMountedRef.current = false;
        setAddWalletModalVisible(false);
        setEditingWallet(null);
      };
    }, []),
  );

  // Helper functions for wallet types
  const getWalletIcon = (type) => {
    switch (type) {
      case 'cash': return 'cash';
      case 'bank': return 'bank';
      case 'upi': return 'cellphone';
      case 'credit_card': return 'credit-card';
      default: return 'wallet';
    }
  };

  const getWalletTypeColor = (type) => {
    switch (type) {
      case 'cash': return '#34A853';
      case 'bank': return '#1A73E8';
      case 'upi': return '#9C27B0';
      case 'credit_card': return '#F4B400';
      default: return '#666';
    }
  };

  const getWalletTypeLabel = (type) => {
    switch (type) {
      case 'cash': return 'Cash';
      case 'bank': return 'Bank';
      case 'upi': return 'UPI';
      case 'credit_card': return 'Credit Card';
      default: return 'Wallet';
    }
  };

  const getWalletNamePlaceholder = (type) => {
    switch (type) {
      case 'cash': return 'e.g. Cash, Wallet';
      case 'bank': return 'e.g. Savings Account, Current Account';
      case 'upi': return 'e.g. PhonePe, Google Pay, Paytm';
      case 'credit_card': return 'e.g. HDFC Credit Card, SBI Credit Card';
      default: return 'Wallet Name';
    }
  };

  const handleSaveWallet = async () => {
    if (!newWalletName.trim()) return;
    
    try {
      const db = await getDB();
      
      if (editingWallet) {
        // Update existing wallet
        await db.executeSql(
          'UPDATE wallets SET name = ?, type = ?, bank_name = ?, last_4_digits = ? WHERE id = ?',
          [
            newWalletName.trim(),
            newWalletType,
            newWalletType === 'bank' || newWalletType === 'credit_card' ? newWalletBankName.trim() : null,
            newWalletType === 'credit_card' ? newWalletLast4Digits.trim() : null,
            editingWallet.id,
          ],
        );
      } else {
        // Create new wallet
        await db.executeSql(
          'INSERT INTO wallets (name, type, bank_name, last_4_digits) VALUES (?, ?, ?, ?)',
          [
            newWalletName.trim(),
            newWalletType,
            newWalletType === 'bank' || newWalletType === 'credit_card' ? newWalletBankName.trim() : null,
            newWalletType === 'credit_card' ? newWalletLast4Digits.trim() : null,
          ],
        );
      }
      
      await loadWallets();
      if (isMountedRef.current) {
        setAddWalletModalVisible(false);
        setEditingWallet(null);
        setNewWalletType('cash');
        setNewWalletName('');
        setNewWalletBankName('');
        setNewWalletLast4Digits('');
      }
    } catch (e) {
      console.warn('Failed to save wallet', e);
      Alert.alert('Error', 'Failed to save wallet. Please try again.');
    }
  };

  const handleDeleteWallet = async (wallet) => {
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
              // Check if wallet is used in transactions
              const [result] = await db.executeSql(
                'SELECT COUNT(*) as count FROM transactions WHERE wallet_id = ?',
                [wallet.id],
              );
              const count = result.rows.item(0).count;
              
              if (count > 0) {
                Alert.alert(
                  'Cannot Delete',
                  `This wallet is used in ${count} transaction(s). Please remove or reassign those transactions first.`,
                );
                return;
              }
              
              await db.executeSql('DELETE FROM wallets WHERE id = ?', [wallet.id]);
              await loadWallets();
            } catch (e) {
              console.warn('Failed to delete wallet', e);
              Alert.alert('Error', 'Failed to delete wallet. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleEditWallet = (wallet) => {
    setEditingWallet(wallet);
    setNewWalletType(wallet.type || 'cash');
    setNewWalletName(wallet.name || '');
    setNewWalletBankName(wallet.bank_name || '');
    setNewWalletLast4Digits(wallet.last_4_digits || '');
    setAddWalletModalVisible(true);
  };

  const handleAddWallet = () => {
    setEditingWallet(null);
    setNewWalletType('cash');
    setNewWalletName('');
    setNewWalletBankName('');
    setNewWalletLast4Digits('');
    setAddWalletModalVisible(true);
  };

  const handleCloseModal = () => {
    if (isMountedRef.current) {
      setAddWalletModalVisible(false);
      setEditingWallet(null);
      setNewWalletType('cash');
      setNewWalletName('');
      setNewWalletBankName('');
      setNewWalletLast4Digits('');
    }
  };

  const filteredWallets = wallets;

  return (
    <>
      <AppHeader showBack title="Manage Wallets" />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.header}>
          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Your Wallets ({wallets.length})
          </Text>
          <Button
            mode="contained"
            onPress={handleAddWallet}
            icon="plus"
            style={styles.addButton}
          >
            Add Wallet
          </Button>
        </View>

        {wallets.length === 0 ? (
          <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.emptyContent}>
              <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
                No wallets yet. Add your first wallet to get started!
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <FlatList
            data={filteredWallets}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => {
              const walletColor = getWalletTypeColor(item.type);
              return (
                <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                  <Card.Content>
                    <View style={styles.walletItem}>
                      <View style={styles.walletItemLeft}>
                        <View style={[styles.walletIconContainer, { backgroundColor: walletColor + '20' }]}>
                          <List.Icon
                            icon={getWalletIcon(item.type)}
                            color={walletColor}
                            size={24}
                          />
                        </View>
                        <View style={styles.walletItemInfo}>
                          <Text style={[styles.walletName, { color: theme.colors.onSurface }]}>
                            {item.name}
                          </Text>
                          <View style={styles.walletMeta}>
                            <View style={[styles.walletTypeBadge, { backgroundColor: walletColor + '15' }]}>
                              <Text style={[styles.walletTypeBadgeText, { color: walletColor }]}>
                                {getWalletTypeLabel(item.type)}
                              </Text>
                            </View>
                            {item.bank_name && (
                              <Text style={[styles.walletMetaText, { color: theme.colors.onSurface }]}>
                                • {item.bank_name}
                              </Text>
                            )}
                            {item.last_4_digits && (
                              <Text style={[styles.walletMetaText, { color: theme.colors.onSurface }]}>
                                • **** {item.last_4_digits}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                      <View style={styles.walletActions}>
                        <IconButton
                          icon="pencil"
                          size={20}
                          iconColor={theme.colors.primary}
                          onPress={() => handleEditWallet(item)}
                        />
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor="#E91E63"
                          onPress={() => handleDeleteWallet(item)}
                        />
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              );
            }}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>

      {/* Add/Edit Wallet Modal */}
      <Portal>
        <Modal
          visible={addWalletModalVisible}
          onDismiss={handleCloseModal}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              {editingWallet ? 'Edit Wallet' : 'Add New Wallet'}
            </Text>
            <IconButton
              icon="close"
              size={24}
              iconColor={theme.colors.onSurface}
              onPress={handleCloseModal}
            />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text variant="bodyMedium" style={[styles.formLabel, { color: theme.colors.onSurface }]}>
              Wallet Type
            </Text>
            <View style={styles.walletTypeContainer}>
              {['cash', 'bank', 'upi', 'credit_card'].map(walletType => (
                <TouchableOpacity
                  key={walletType}
                  onPress={() => setNewWalletType(walletType)}
                  style={[
                    styles.walletTypeButton,
                    { backgroundColor: theme.colors.surface },
                    newWalletType === walletType && [
                      styles.walletTypeButtonActive,
                      { backgroundColor: theme.colors.primary },
                    ],
                  ]}
                >
                  <Text
                    style={[
                      styles.walletTypeButtonText,
                      { color: theme.colors.onSurface },
                      newWalletType === walletType && styles.walletTypeButtonTextActive,
                    ]}
                  >
                    {walletType === 'cash' ? 'Cash' : walletType === 'bank' ? 'Bank' : walletType === 'upi' ? 'UPI' : 'Credit Card'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              mode="outlined"
              label="Wallet Name"
              value={newWalletName}
              onChangeText={setNewWalletName}
              placeholder={getWalletNamePlaceholder(newWalletType)}
              style={styles.input}
              outlineColor="#E0E0E0"
              activeOutlineColor={theme.colors.primary}
            />

            {(newWalletType === 'bank' || newWalletType === 'credit_card') && (
              <TextInput
                mode="outlined"
                label="Bank Name"
                value={newWalletBankName}
                onChangeText={setNewWalletBankName}
                placeholder="e.g. HDFC Bank, SBI, ICICI"
                style={styles.input}
                outlineColor="#E0E0E0"
                activeOutlineColor={theme.colors.primary}
              />
            )}

            {newWalletType === 'credit_card' && (
              <TextInput
                mode="outlined"
                label="Last 4 Digits"
                value={newWalletLast4Digits}
                onChangeText={(text) => {
                  if (text.length <= 4 && /^\d*$/.test(text)) {
                    setNewWalletLast4Digits(text);
                  }
                }}
                placeholder="1234"
                keyboardType="numeric"
                maxLength={4}
                style={styles.input}
                outlineColor="#E0E0E0"
                activeOutlineColor={theme.colors.primary}
              />
            )}

            <View style={styles.modalActions}>
              {editingWallet && (
                <Button
                  mode="text"
                  textColor="#E91E63"
                  onPress={() => handleDeleteWallet(editingWallet)}
                  style={styles.deleteButton}
                >
                  Delete
                </Button>
              )}
              <Button
                mode="contained"
                onPress={handleSaveWallet}
                disabled={!newWalletName.trim()}
                style={styles.saveButton}
              >
                {editingWallet ? 'Update' : 'Save'}
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
    </>
  );
};

export default WalletsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    fontSize: 18,
  },
  addButton: {
    borderRadius: 8,
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
  },
  walletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  walletIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  walletItemInfo: {
    flex: 1,
  },
  walletName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  walletMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  walletTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
  },
  walletTypeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  walletMetaText: {
    fontSize: 12,
    opacity: 0.7,
  },
  walletActions: {
    flexDirection: 'row',
  },
  emptyContent: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.6,
  },
  listContent: {
    paddingBottom: 16,
  },
  modal: {
    margin: 20,
    borderRadius: 16,
    maxHeight: '85%',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontWeight: '600',
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: 500,
  },
  formLabel: {
    marginBottom: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  walletTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  walletTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  walletTypeButtonActive: {
    borderColor: '#1E4E7C',
  },
  walletTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  walletTypeButtonTextActive: {
    color: '#FFFFFF',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    gap: 12,
  },
  deleteButton: {
    minWidth: 80,
  },
  saveButton: {
    minWidth: 80,
  },
});
