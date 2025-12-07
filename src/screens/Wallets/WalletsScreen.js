import React, { useState, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import {
  Button,
  Card,
  List,
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
      
      // Use setTimeout to ensure we're not updating during unmount
      setTimeout(() => {
        if (isMountedRef.current) {
          setWallets(rows);
        }
      }, 0);
    } catch (e) {
      console.warn('Failed to load wallets', e);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      isMountedRef.current = true;
      loadWallets();
      return () => {
        isMountedRef.current = false;
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
    navigation.navigate('AddEditWallet', { wallet });
  };

  const handleAddWallet = () => {
    navigation.navigate('AddEditWallet');
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
            removeClippedSubviews={false}
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
});
