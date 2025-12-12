import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Platform, TouchableOpacity, Dimensions, TextInput as RNTextInput, BackHandler, Alert } from 'react-native';
import { Button, Text, List, Portal, Modal, useTheme, TextInput, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDB } from '../../database';
import { AppHeader } from '../../components/AppHeader';
import { useFocusEffect } from '@react-navigation/native';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency } from '../../utils/currencies';

const screenWidth = Dimensions.get('window').width;

const AddTransactionScreen = ({ navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { currency } = useAppStore();
  const isMountedRef = useRef(true);
  const [amount, setAmount] = useState('');
  const [calculatedAmount, setCalculatedAmount] = useState('');
  const [type, setType] = useState('expense');
  const [categoryId, setCategoryId] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [walletId, setWalletId] = useState(null);
  const [walletName, setWalletName] = useState('');
  const [note, setNote] = useState('');
  const [categories, setCategories] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempSelectedDate, setTempSelectedDate] = useState(new Date());
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [newWalletType, setNewWalletType] = useState('cash');
  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletBankName, setNewWalletBankName] = useState('');
  const [newWalletLast4Digits, setNewWalletLast4Digits] = useState('');

  // Custom back handler that closes modals before navigating
  const handleBackPress = useCallback(() => {
    if (categoryPickerVisible || walletModalVisible || showAddWalletModal || showDatePicker || showAmountModal) {
      // Close all modals first
      setCategoryPickerVisible(false);
      setWalletModalVisible(false);
      setShowAddWalletModal(false);
      setShowDatePicker(false);
      setShowAmountModal(false);
      setEditingWallet(null);
      setTempSelectedDate(selectedDate);
      // Small delay to ensure modals are fully closed before navigation
      setTimeout(() => {
        if (isMountedRef.current) {
          navigation.goBack();
        }
      }, 100);
    } else {
      navigation.goBack();
    }
  }, [navigation, categoryPickerVisible, walletModalVisible, showAddWalletModal, showDatePicker, showAmountModal, selectedDate]);

  // Handle Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (categoryPickerVisible || walletModalVisible || showAddWalletModal || showDatePicker || showAmountModal) {
        // Close modals first
        setCategoryPickerVisible(false);
        setWalletModalVisible(false);
        setShowAddWalletModal(false);
        setShowDatePicker(false);
        setShowAmountModal(false);
        setEditingWallet(null);
        return true; // Prevent default back behavior
      }
      return false; // Allow default back behavior
    });

    return () => backHandler.remove();
  }, [categoryPickerVisible, walletModalVisible, showAddWalletModal, showDatePicker, showAmountModal]);

  // Ensure modals are closed when leaving this screen to avoid Android ViewGroup errors
  useFocusEffect(
    useCallback(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
        // Close all modals before unmounting
        setCategoryPickerVisible(false);
        setWalletModalVisible(false);
        setShowAddWalletModal(false);
        setShowDatePicker(false);
        setShowAmountModal(false);
        setEditingWallet(null);
      };
    }, []),
  );

  const loadCategories = async () => {
    try {
      const db = await getDB();
      const [result] = await db.executeSql(
        'SELECT id, name, type, icon FROM categories ORDER BY name ASC',
      );
      const rows = [];
      for (let i = 0; i < result.rows.length; i += 1) {
        rows.push(result.rows.item(i));
      }
      setCategories(rows);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load categories', e);
    }
  };

  const loadWallets = async () => {
    try {
      const db = await getDB();
      const [result] = await db.executeSql(
        'SELECT id, name, type, bank_name, last_4_digits FROM wallets ORDER BY name ASC',
      );
      const rows = [];
      for (let i = 0; i < result.rows.length; i += 1) {
        rows.push(result.rows.item(i));
      }
      setWallets(rows);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to load wallets', e);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadCategories();
      loadWallets();
      return () => {
        setCategoryPickerVisible(false);
        setWalletModalVisible(false);
      };
    }, []),
  );

  // Calculator functions
  const handleNumberPress = (num) => {
    if (calculatedAmount) {
      // If there's a calculated result, start fresh
      setAmount(num);
      setCalculatedAmount('');
    } else {
      setAmount(prev => prev + num);
    }
  };

  const handleOperatorPress = (operator) => {
    if (!amount) return;
    
    // If there's already a calculated result, use it as the starting point
    if (calculatedAmount) {
      setAmount(calculatedAmount + operator);
      setCalculatedAmount('');
      return;
    }
    
    // If the last character is already an operator, replace it
    const lastChar = amount.slice(-1);
    if (['+', '-', '×', '÷', '–'].includes(lastChar)) {
      setAmount(prev => prev.slice(0, -1) + operator);
      return;
    }
    
    setAmount(prev => prev + operator);
  };

  const calculateResult = () => {
    if (!amount) return;
    
    try {
      // Remove any trailing operators
      let cleanAmount = amount.replace(/[+\-×÷–]$/, '');
      if (!cleanAmount) return;
      
      // Replace operators with JavaScript operators
      let expression = cleanAmount
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/–/g, '-');
      
      // Simple evaluation - only allow numbers and basic operators
      if (/^[0-9+\-*/.() ]+$/.test(expression)) {
        // eslint-disable-next-line no-eval
        const result = eval(expression);
        
        if (!isNaN(result) && isFinite(result)) {
          const resultStr = result.toString();
          setCalculatedAmount(resultStr);
          setAmount(resultStr);
        }
      }
    } catch (e) {
      // Invalid expression, do nothing
    }
  };

  const handleClear = () => {
    setAmount('');
    setCalculatedAmount('');
  };

  const handleBackspace = () => {
    setAmount(prev => prev.slice(0, -1));
    setCalculatedAmount('');
  };

  const handleDecimal = () => {
    if (!amount) {
      setAmount('0.');
    } else if (!amount.includes('.')) {
      setAmount(prev => prev + '.');
    }
  };

  const onSave = async () => {
    const finalAmount = calculatedAmount || amount;
    if (!finalAmount || isNaN(Number(finalAmount))) {
      return;
    }

    try {
      const db = await getDB();
      let categoryIdToUse = categoryId;

      await db.executeSql(
        'INSERT INTO transactions (amount, type, category_id, wallet_id, date, note) VALUES (?, ?, ?, ?, ?, ?)',
        [Number(finalAmount), type, categoryIdToUse, walletId, selectedDate.toISOString(), note],
      );

      navigation.goBack();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to save transaction', e);
    }
  };

  // Display the expression as user types, or the calculated result if available
  const displayAmount = calculatedAmount || amount;

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

  const getWalletNamePlaceholder = (type) => {
    switch (type) {
      case 'cash': return 'e.g. Cash, Wallet';
      case 'bank': return 'e.g. Savings Account, Current Account';
      case 'upi': return 'e.g. PhonePe, Google Pay, Paytm';
      case 'credit_card': return 'e.g. HDFC Credit Card, SBI Credit Card';
      default: return 'Wallet Name';
    }
  };

  return (
    <>
      <AppHeader showBack title="New Transaction" onBackPress={handleBackPress} />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Type Selection - Segmented Control */}
          <View style={styles.typeContainer}>
          <View style={[styles.segmentedControl, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity
              style={[
                styles.segmentedButton,
                type === 'expense' && [styles.segmentedButtonActive, { backgroundColor: theme.colors.primary }],
              ]}
              onPress={() => setType('expense')}
            >
              <Text
                style={[
                  styles.segmentedButtonText,
                  type === 'expense' && { color: '#FFFFFF' },
                  type !== 'expense' && { color: theme.colors.onSurface },
                ]}
              >
                Expense
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.segmentedButton,
                type === 'income' && [styles.segmentedButtonActive, { backgroundColor: theme.colors.primary }],
              ]}
              onPress={() => setType('income')}
            >
              <Text
                style={[
                  styles.segmentedButtonText,
                  type === 'income' && { color: '#FFFFFF' },
                  type !== 'income' && { color: theme.colors.onSurface },
                ]}
              >
                Income
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transaction Details Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <Text variant="bodySmall" style={[styles.sectionHeader, { color: theme.colors.onSurface }]}>
            Transaction Details
          </Text>
          
          <List.Item
            title="Date"
            description={selectedDate.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
            left={props => <List.Icon {...props} icon="calendar" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              setTempSelectedDate(selectedDate);
              setShowDatePicker(true);
            }}
            style={styles.listItem}
          />
          
          <List.Item
            title="Amount"
            description={
              displayAmount 
                ? (calculatedAmount 
                    ? formatCurrency(Number(displayAmount), currency)
                    : formatCurrency(Number(displayAmount) || 0, currency))
                : 'Tap to enter amount'
            }
            left={props => <List.Icon {...props} icon="currency-usd" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setShowAmountModal(true)}
            style={styles.listItem}
          />
          
          <List.Item
            title="Category"
            description={categoryName || 'Not Selected'}
            left={props => <List.Icon {...props} icon="shape" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setCategoryPickerVisible(true)}
            style={styles.listItem}
          />

          <List.Item
            title="Wallet"
            description={walletName || 'Not Selected'}
            left={props => <List.Icon {...props} icon="wallet" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => setWalletModalVisible(true)}
            style={styles.listItem}
          />
        </View>

        {/* Note Section */}
        <View style={[styles.section, { backgroundColor: '#FFFFFF' }]}>
          <View style={styles.noteInputContainer}>
            <TextInput
              mode="outlined"
              value={note}
              onChangeText={setNote}
              placeholder="Add a note (optional)"
              multiline
              numberOfLines={4}
              style={styles.noteInput}
              outlineColor="#E0E0E0"
              activeOutlineColor={theme.colors.primary}
              contentStyle={styles.noteInputContent}
            />
          </View>
        </View>
        </ScrollView>

        {/* Save Button - Fixed at bottom */}
        <View style={[
          styles.saveContainer, 
          { 
            backgroundColor: theme.colors.surface,
            paddingBottom: Math.max(insets.bottom, 16),
          }
        ]}>
          <Button
            mode="contained"
            onPress={onSave}
            style={[styles.saveButton, { backgroundColor: theme.colors.primary }]}
            contentStyle={styles.saveButtonContent}
            disabled={!amount && !calculatedAmount}
          >
            Save Transaction
          </Button>
        </View>
      </View>

      {/* Category Picker Modal */}
      <Portal>
        <Modal
          visible={categoryPickerVisible}
          onDismiss={() => {
            if (isMountedRef.current) {
              setCategoryPickerVisible(false);
            }
          }}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleMedium" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            Select Category
          </Text>
          <ScrollView style={styles.categoryScroll}>
            {categories
              .filter(c => c.type === type)
              .map(c => (
                <List.Item
                  key={c.id}
                  title={c.name}
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={c.icon || (c.type === 'income' ? 'arrow-down' : 'arrow-up')}
                    />
                  )}
                  onPress={() => {
                    setCategoryId(c.id);
                    setCategoryName(c.name);
                    setCategoryPickerVisible(false);
                  }}
                />
              ))}
          </ScrollView>
          <Button onPress={() => {
            if (isMountedRef.current) {
              setCategoryPickerVisible(false);
            }
          }}>Close</Button>
        </Modal>
      </Portal>

      {/* Wallet Selection Modal */}
      <Portal>
        <Modal
          visible={walletModalVisible}
          onDismiss={() => {
            if (isMountedRef.current) {
              setWalletModalVisible(false);
            }
          }}
          contentContainerStyle={[styles.walletModal, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.walletModalHeader}>
            <Text variant="titleLarge" style={[styles.walletModalTitle, { color: theme.colors.onSurface }]}>
            Select Wallet
          </Text>
            <TouchableOpacity
              onPress={() => {
                if (isMountedRef.current) {
                  setWalletModalVisible(false);
                }
              }}
              style={styles.walletModalCloseButton}
            >
              <Text style={[styles.walletModalCloseText, { color: theme.colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.walletModalContent}>
            {wallets.map(w => (
              <View
                key={w.id}
                style={[
                  styles.walletItem,
                  walletId === w.id && styles.walletItemSelected,
                ]}
              >
                <TouchableOpacity
                  onPress={() => {
                    if (isMountedRef.current) {
                      setWalletId(w.id);
                      setWalletName(w.name + (w.last_4_digits ? ` • ${w.last_4_digits}` : ''));
                      setWalletModalVisible(false);
                    }
                  }}
                  style={styles.walletItemTouchable}
                >
                  <View style={styles.walletItemLeft}>
                    <View style={[styles.walletIconContainer, { backgroundColor: getWalletTypeColor(w.type) + '20' }]}>
                      <List.Icon
                        icon={getWalletIcon(w.type)}
                        color={getWalletTypeColor(w.type)}
                        size={24}
                      />
                    </View>
                    <View style={styles.walletItemInfo}>
                      <Text style={styles.walletItemName}>{w.name}</Text>
                      {w.bank_name && (
                        <Text style={styles.walletItemDetail}>{w.bank_name}</Text>
                      )}
                      {w.last_4_digits && (
                        <Text style={styles.walletItemDetail}>**** {w.last_4_digits}</Text>
                      )}
                    </View>
                  </View>
                  {walletId === w.id && (
                    <List.Icon icon="check-circle" iconColor={theme.colors.primary} size={24} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (isMountedRef.current) {
                      setEditingWallet(w);
                      setNewWalletType(w.type || 'cash');
                      setNewWalletName(w.name || '');
                      setNewWalletBankName(w.bank_name || '');
                      setNewWalletLast4Digits(w.last_4_digits || '');
              setWalletModalVisible(false);
                      setShowAddWalletModal(true);
                    }
                  }}
                  style={styles.walletEditButton}
                >
                  <List.Icon icon="pencil" iconColor="#666" size={20} />
                </TouchableOpacity>
          </View>
            ))}
            
            <TouchableOpacity
              onPress={() => {
                if (isMountedRef.current) {
                  setWalletModalVisible(false);
                  setShowAddWalletModal(true);
                }
              }}
              style={styles.addWalletButton}
            >
              <List.Icon icon="plus-circle" iconColor={theme.colors.primary} size={24} />
              <Text style={[styles.addWalletText, { color: theme.colors.primary }]}>
                Add New Wallet
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Modal>
      </Portal>

      {/* Add/Edit Wallet Modal */}
      <Portal>
        <Modal
          visible={showAddWalletModal}
          onDismiss={() => {
            if (isMountedRef.current) {
              setShowAddWalletModal(false);
              setEditingWallet(null);
              setNewWalletType('cash');
              setNewWalletName('');
              setNewWalletBankName('');
              setNewWalletLast4Digits('');
            }
          }}
          contentContainerStyle={[styles.walletModal, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.walletModalHeader}>
            <Text variant="titleLarge" style={[styles.walletModalTitle, { color: theme.colors.onSurface }]}>
              {editingWallet ? 'Edit Wallet' : 'Add New Wallet'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (isMountedRef.current) {
                  setShowAddWalletModal(false);
                  setEditingWallet(null);
                  setNewWalletType('cash');
                  setNewWalletName('');
                  setNewWalletBankName('');
                  setNewWalletLast4Digits('');
                }
              }}
              style={styles.walletModalCloseButton}
            >
              <Text style={[styles.walletModalCloseText, { color: theme.colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.walletModalContent}>
            <Text variant="bodyMedium" style={[styles.walletFormLabel, { color: theme.colors.onSurface }]}>
              Wallet Type
            </Text>
            <View style={styles.walletTypeContainer}>
              {['cash', 'bank', 'upi', 'credit_card'].map(walletType => (
                <TouchableOpacity
                  key={walletType}
                  onPress={() => setNewWalletType(walletType)}
                  style={[
                    styles.walletTypeButton,
                    newWalletType === walletType && styles.walletTypeButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.walletTypeButtonText,
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
              style={styles.walletFormInput}
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
                style={styles.walletFormInput}
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
                style={styles.walletFormInput}
                outlineColor="#E0E0E0"
                activeOutlineColor={theme.colors.primary}
              />
            )}

            <Button
              mode="contained"
              onPress={async () => {
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
                    
                    // Update selected wallet if it was the one being edited
                    if (walletId === editingWallet.id) {
                      setWalletName(newWalletName.trim() + (newWalletLast4Digits ? ` • ${newWalletLast4Digits}` : ''));
                    }
                  } else {
                    // Create new wallet
                    const [result] = await db.executeSql(
                      'INSERT INTO wallets (name, type, bank_name, last_4_digits) VALUES (?, ?, ?, ?)',
                      [
                        newWalletName.trim(),
                        newWalletType,
                        newWalletType === 'bank' || newWalletType === 'credit_card' ? newWalletBankName.trim() : null,
                        newWalletType === 'credit_card' ? newWalletLast4Digits.trim() : null,
                      ],
                    );
                    
                    const newWalletId = result.insertId;
                    setWalletId(newWalletId);
                    setWalletName(newWalletName.trim() + (newWalletLast4Digits ? ` • ${newWalletLast4Digits}` : ''));
                  }
                  
                  await loadWallets();
                  if (isMountedRef.current) {
                    setShowAddWalletModal(false);
                    setEditingWallet(null);
                    setNewWalletType('cash');
                    setNewWalletName('');
                    setNewWalletBankName('');
                    setNewWalletLast4Digits('');
                  }
                } catch (e) {
                  console.warn('Failed to save wallet', e);
                }
              }}
              style={styles.walletModalSaveButton}
              contentStyle={styles.walletModalSaveButtonContent}
              disabled={!newWalletName.trim()}
            >
              {editingWallet ? 'Update Wallet' : 'Save Wallet'}
            </Button>
            
            {editingWallet && (
              <Button
                mode="outlined"
                onPress={async () => {
                  try {
                    const db = await getDB();
                    await db.executeSql('DELETE FROM wallets WHERE id = ?', [editingWallet.id]);
                    
                    // Clear selection if deleted wallet was selected
                    if (walletId === editingWallet.id) {
                      setWalletId(null);
                      setWalletName('');
                    }
                    
                    await loadWallets();
                    if (isMountedRef.current) {
                      setShowAddWalletModal(false);
                      setEditingWallet(null);
                      setNewWalletType('cash');
                      setNewWalletName('');
                      setNewWalletBankName('');
                      setNewWalletLast4Digits('');
                    }
                  } catch (e) {
                    console.warn('Failed to delete wallet', e);
                  }
                }}
                style={[styles.walletModalSaveButton, styles.walletDeleteButton]}
                contentStyle={styles.walletModalSaveButtonContent}
                textColor="#E91E63"
              >
                Delete Wallet
              </Button>
            )}
          </ScrollView>
        </Modal>
      </Portal>

      {/* Amount Calculator Modal */}
      <Portal>
        <Modal
          visible={showAmountModal}
          onDismiss={() => {
            if (isMountedRef.current) {
              setShowAmountModal(false);
            }
          }}
          contentContainerStyle={[styles.amountModal, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.amountModalHeader}>
            <Text variant="titleLarge" style={[styles.amountModalTitle, { color: theme.colors.onSurface }]}>
              Enter Amount
            </Text>
            <IconButton
              icon="close"
              onPress={() => {
                if (isMountedRef.current) {
                  setShowAmountModal(false);
                }
              }}
              size={24}
            />
          </View>

          {/* Amount Display */}
          <View style={styles.amountDisplaySection}>
            <Text variant="labelMedium" style={[styles.amountDisplayLabel, { color: theme.colors.onSurfaceVariant }]}>
              Amount
            </Text>
            <Text variant="displaySmall" style={[styles.amountDisplayText, { color: theme.colors.onSurface }]}>
              {displayAmount 
                ? (calculatedAmount 
                    ? formatCurrency(Number(displayAmount), currency)
                    : displayAmount.includes('+') || displayAmount.includes('–') || displayAmount.includes('×') || displayAmount.includes('÷')
                      ? displayAmount + ' = ?'
                      : formatCurrency(Number(displayAmount) || 0, currency))
                : '0.00'}
            </Text>
            {displayAmount && !calculatedAmount && (displayAmount.includes('+') || displayAmount.includes('–') || displayAmount.includes('×') || displayAmount.includes('÷')) && (
              <Button
                mode="contained"
                onPress={calculateResult}
                style={[styles.calculateButton, { backgroundColor: theme.colors.primary }]}
                compact
              >
                Calculate
              </Button>
            )}
          </View>

          {/* Numeric Keypad */}
          <View style={styles.keypadContainer}>
            <View style={styles.keypadRow}>
              {[1, 2, 3].map(num => (
                <TouchableOpacity
                  key={num}
                  style={[styles.keypadButton, { backgroundColor: '#FFFFFF' }]}
                  onPress={() => handleNumberPress(num.toString())}
                >
                  <Text style={styles.keypadButtonText}>{num}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.keypadButton, styles.operatorButton, { backgroundColor: '#E0E0E0' }]}
                onPress={handleBackspace}
              >
                <Text style={styles.keypadButtonText}>⌫</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.keypadButton, styles.operatorButton, { backgroundColor: '#E0E0E0' }]}
                onPress={() => handleOperatorPress('÷')}
              >
                <Text style={styles.keypadButtonText}>÷</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.keypadRow}>
              {[4, 5, 6].map(num => (
                <TouchableOpacity
                  key={num}
                  style={[styles.keypadButton, { backgroundColor: '#FFFFFF' }]}
                  onPress={() => handleNumberPress(num.toString())}
                >
                  <Text style={styles.keypadButtonText}>{num}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.keypadButton, styles.operatorButton, { backgroundColor: '#E0E0E0' }]}
                onPress={() => handleOperatorPress('×')}
              >
                <Text style={styles.keypadButtonText}>×</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.keypadButton, styles.operatorButton, { backgroundColor: '#E0E0E0' }]}
                onPress={() => handleOperatorPress('–')}
              >
                <Text style={styles.keypadButtonText}>–</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.keypadRow}>
              {[7, 8, 9].map(num => (
                <TouchableOpacity
                  key={num}
                  style={[styles.keypadButton, { backgroundColor: '#FFFFFF' }]}
                  onPress={() => handleNumberPress(num.toString())}
                >
                  <Text style={styles.keypadButtonText}>{num}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.keypadButton, styles.operatorButton, { backgroundColor: '#E0E0E0' }]}
                onPress={() => handleOperatorPress('+')}
              >
                <Text style={styles.keypadButtonText}>+</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.keypadButton, styles.equalsButton, { backgroundColor: theme.colors.primary }]}
                onPress={calculateResult}
              >
                <Text style={[styles.keypadButtonText, { color: '#FFFFFF', fontSize: 24 }]}>=</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.keypadRow}>
              <TouchableOpacity
                style={[styles.keypadButton, styles.zeroButton, { backgroundColor: '#FFFFFF' }]}
                onPress={() => handleNumberPress('0')}
              >
                <Text style={styles.keypadButtonText}>0</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.keypadButton, { backgroundColor: '#FFFFFF' }]}
                onPress={handleDecimal}
              >
                <Text style={styles.keypadButtonText}>.</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.keypadButton, styles.clearButton, { backgroundColor: '#E0E0E0' }]}
                onPress={handleClear}
              >
                <Text style={styles.keypadButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.amountModalActions}>
            <Button
              mode="outlined"
              onPress={() => {
                if (isMountedRef.current) {
                  setShowAmountModal(false);
                }
              }}
              style={styles.amountModalButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                if (isMountedRef.current) {
                  setShowAmountModal(false);
                }
              }}
              style={styles.amountModalButton}
            >
              Done
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Custom Date Picker Modal */}
      <Portal>
        <Modal
          visible={showDatePicker}
          onDismiss={() => {
            if (isMountedRef.current) {
              setShowDatePicker(false);
              setTempSelectedDate(selectedDate);
            }
          }}
          contentContainerStyle={[styles.dateModal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleMedium" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            Select Date
          </Text>
          
          <View style={styles.datePickerCompact}>
            {/* Day Selection */}
            <View style={styles.daySelectorContainer}>
              <Text variant="labelMedium" style={[styles.selectorLabel, { color: theme.colors.onSurface }]}>
                Day
              </Text>
              <View style={styles.daySelectorRow}>
                <IconButton
                  icon="chevron-left"
                  size={20}
                  onPress={() => {
                    const newDate = new Date(tempSelectedDate);
                    const currentDay = newDate.getDate();
                    if (currentDay > 1) {
                      newDate.setDate(currentDay - 1);
                    } else {
                      newDate.setMonth(newDate.getMonth() - 1);
                      newDate.setDate(0);
                    }
                    setTempSelectedDate(newDate);
                  }}
                />
                <Text variant="titleLarge" style={[styles.dayText, { color: theme.colors.onSurface }]}>
                  {tempSelectedDate.getDate()}
                </Text>
                <IconButton
                  icon="chevron-right"
                  size={20}
                  onPress={() => {
                    const newDate = new Date(tempSelectedDate);
                    const currentDay = newDate.getDate();
                    const lastDayOfMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
                    if (currentDay < lastDayOfMonth) {
                      newDate.setDate(currentDay + 1);
                    } else {
                      newDate.setMonth(newDate.getMonth() + 1);
                      newDate.setDate(1);
                    }
                    setTempSelectedDate(newDate);
                  }}
                />
              </View>
            </View>

            {/* Month Selection Grid - Compact 4 columns */}
            <View style={styles.monthGridContainer}>
              <Text variant="labelMedium" style={[styles.selectorLabel, { color: theme.colors.onSurface }]}>
                Month
              </Text>
              <View style={styles.monthGrid}>
                {[
                  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                ].map((month, index) => {
                  const isSelected = tempSelectedDate.getMonth() === index;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.monthButton,
                        isSelected && [styles.monthButtonActive, { backgroundColor: theme.colors.primary }],
                      ]}
                      onPress={() => {
                        const newDate = new Date(tempSelectedDate);
                        const currentDay = newDate.getDate();
                        newDate.setMonth(index);
                        const lastDayOfNewMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0).getDate();
                        if (currentDay > lastDayOfNewMonth) {
                          newDate.setDate(lastDayOfNewMonth);
                        }
                        setTempSelectedDate(newDate);
                      }}
                    >
                      <Text
                        style={[
                          styles.monthButtonText,
                          isSelected && { color: '#FFFFFF' },
                          !isSelected && { color: theme.colors.onSurface },
                        ]}
                      >
                        {month}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Year Selection */}
            <View style={styles.dateSelectorContainer}>
              <Text variant="labelMedium" style={[styles.selectorLabel, { color: theme.colors.onSurface }]}>
                Year
              </Text>
              <View style={styles.yearSelectorRow}>
                <IconButton
                  icon="chevron-left"
                  size={20}
                  onPress={() => {
                    const newDate = new Date(tempSelectedDate);
                    newDate.setFullYear(newDate.getFullYear() - 1);
                    setTempSelectedDate(newDate);
                  }}
                />
                <Text variant="titleLarge" style={[styles.yearText, { color: theme.colors.onSurface }]}>
                  {tempSelectedDate.getFullYear()}
                </Text>
                <IconButton
                  icon="chevron-right"
                  size={20}
                  onPress={() => {
                    const newDate = new Date(tempSelectedDate);
                    newDate.setFullYear(newDate.getFullYear() + 1);
                    setTempSelectedDate(newDate);
                  }}
                />
              </View>
            </View>
          </View>

          <View style={styles.datePickerActions}>
            <Button
              mode="outlined"
              onPress={() => {
                if (isMountedRef.current) {
                  setShowDatePicker(false);
                  setTempSelectedDate(selectedDate);
                }
              }}
              style={styles.datePickerButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                if (isMountedRef.current) {
                  setSelectedDate(new Date(tempSelectedDate));
                  setShowDatePicker(false);
                }
              }}
              style={styles.datePickerButton}
            >
              Done
            </Button>
          </View>
        </Modal>
      </Portal>
    </>
  );
};

export default AddTransactionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  typeContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  segmentedButtons: {
    marginTop: 8,
  },
  section: {
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    opacity: 0.7,
  },
  listItem: {
    paddingVertical: 8,
  },
  noteInputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  noteInput: {
    backgroundColor: '#FFFFFF',
    fontSize: 14,
  },
  noteInputContent: {
    minHeight: 100,
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  saveContainer: {
    padding: 16,
    paddingTop: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButton: {
    borderRadius: 12,
    elevation: 2,
  },
  saveButtonContent: {
    paddingVertical: 8,
  },
  amountModal: {
    margin: 20,
    borderRadius: 12,
    maxHeight: '85%',
    padding: 0,
  },
  amountModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  amountModalTitle: {
    fontWeight: '600',
  },
  amountDisplaySection: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  amountDisplayLabel: {
    marginBottom: 8,
    opacity: 0.7,
    fontSize: 12,
    fontWeight: '600',
  },
  amountDisplayText: {
    fontWeight: '700',
    fontSize: 36,
    marginBottom: 12,
  },
  calculateButton: {
    marginTop: 8,
  },
  keypadContainer: {
    padding: 12,
    paddingTop: 8,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  keypadButton: {
    flex: 1,
    minWidth: 0,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginHorizontal: 2,
  },
  operatorButton: {
    flex: 1,
    minWidth: 0,
  },
  equalsButton: {
    flex: 1,
    minWidth: 0,
  },
  zeroButton: {
    flex: 2,
    minWidth: 0,
  },
  clearButton: {
    flex: 2,
    minWidth: 0,
  },
  amountModalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  amountModalButton: {
    flex: 1,
  },
  keypadButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  modal: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    maxHeight: '80%',
  },
  modalTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  dateModal: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    maxHeight: '70%',
  },
  datePickerCompact: {
    paddingVertical: 8,
  },
  dateSelectorContainer: {
    marginBottom: 16,
  },
  selectorLabel: {
    marginBottom: 8,
    fontWeight: '600',
    fontSize: 12,
  },
  yearSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  yearText: {
    minWidth: 70,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 20,
  },
  monthGridContainer: {
    marginBottom: 16,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
  },
  monthButton: {
    width: '23%',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  monthButtonActive: {
    borderColor: '#1E4E7C',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  monthButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  daySelectorContainer: {
    marginBottom: 16,
  },
  daySelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  dayText: {
    minWidth: 50,
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 20,
  },
  datePickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  datePickerButton: {
    flex: 1,
  },
  categoryScroll: {
    maxHeight: 300,
    marginTop: 8,
    marginBottom: 8,
  },
  walletModal: {
    margin: 0,
    padding: 0,
    borderRadius: Platform.OS === 'ios' ? 20 : 12,
    maxHeight: '50%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  walletModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  walletModalTitle: {
    fontWeight: '700',
    fontSize: 20,
  },
  walletModalCloseButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  walletModalCloseText: {
    fontSize: 16,
    fontWeight: '600',
  },
  walletModalContent: {
    padding: 20,
    paddingTop: 16,
    maxHeight: 500,
  },
  walletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    overflow: 'hidden',
  },
  walletItemTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
    padding: 12,
  },
  walletEditButton: {
    padding: 12,
    borderLeftWidth: 1,
    borderLeftColor: '#E0E0E0',
  },
  walletItemSelected: {
    backgroundColor: '#E3F2FD',
    borderWidth: 2,
    borderColor: '#1E4E7C',
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
  walletItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  walletItemDetail: {
    fontSize: 12,
    color: '#666',
  },
  addWalletButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1E4E7C',
    borderStyle: 'dashed',
  },
  addWalletText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  walletFormLabel: {
    marginBottom: 8,
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
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  walletTypeButtonActive: {
    backgroundColor: '#1E4E7C',
    borderColor: '#1E4E7C',
  },
  walletTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  walletTypeButtonTextActive: {
    color: '#FFFFFF',
  },
  walletFormInput: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  walletInput: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  walletModalSaveButton: {
    borderRadius: 12,
    elevation: 0,
    marginTop: 8,
  },
  walletModalSaveButtonContent: {
    paddingVertical: 8,
  },
  walletDeleteButton: {
    marginTop: 12,
    borderColor: '#E91E63',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  segmentedButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedButtonActive: {
    elevation: 2,
  },
  segmentedButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

