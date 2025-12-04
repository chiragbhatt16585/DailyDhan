import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Platform, TouchableOpacity, Dimensions, TextInput as RNTextInput } from 'react-native';
import { Button, Text, List, Portal, Modal, useTheme, TextInput } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
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
  const [amount, setAmount] = useState('');
  const [calculatedAmount, setCalculatedAmount] = useState('');
  const [type, setType] = useState('expense');
  const [categoryId, setCategoryId] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [wallet, setWallet] = useState('');
  const [note, setNote] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [tempWallet, setTempWallet] = useState('');

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

  useFocusEffect(
    React.useCallback(() => {
      loadCategories();
      return () => {
        setCategoryPickerVisible(false);
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
      let walletId = null;

      if (wallet) {
        const [selectWallet] = await db.executeSql(
          'SELECT id FROM wallets WHERE name = ? LIMIT 1',
          [wallet.trim()],
        );
        if (selectWallet.rows.length > 0) {
          walletId = selectWallet.rows.item(0).id;
        } else {
          const [insertWallet] = await db.executeSql(
            'INSERT INTO wallets (name) VALUES (?)',
            [wallet.trim()],
          );
          walletId = insertWallet.insertId;
        }
      }

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

  return (
    <>
      <AppHeader showBack title="New Transaction" />
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
            onPress={() => setShowDatePicker(true)}
            style={styles.listItem}
          />
          
          <List.Item
            title="Amount"
            description={
              displayAmount 
                ? (calculatedAmount 
                    ? formatCurrency(Number(displayAmount), currency)
                    : displayAmount) // Show expression while typing, formatted currency after calculation
                : 'Enter amount'
            }
            left={props => <List.Icon {...props} icon="currency-usd" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
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
        </View>

        {/* Wallet Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <List.Item
            title="Wallet"
            description={wallet || 'Not Selected'}
            left={props => <List.Icon {...props} icon="wallet" />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              setTempWallet(wallet);
              setWalletModalVisible(true);
            }}
            style={styles.listItem}
          />
        </View>

        {/* Note Section */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.noteInputContainer}>
            <TextInput
              mode="flat"
              value={note}
              onChangeText={setNote}
              placeholder="Note (optional)"
              multiline
              numberOfLines={2}
              style={styles.noteInput}
              dense
              underlineColor="transparent"
              activeUnderlineColor="transparent"
            />
          </View>
        </View>
        </ScrollView>

        {/* Numeric Keypad - Fixed at bottom */}
        <View style={[
          styles.keypadContainer, 
          { 
            backgroundColor: theme.colors.surface,
            paddingBottom: Math.max(insets.bottom, 8),
          }
        ]}>
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
              style={[styles.keypadButton, styles.saveButtonKeypad, { backgroundColor: theme.colors.primary }]}
              onPress={onSave}
            >
              <Text style={[styles.keypadButtonText, { color: '#FFFFFF' }]}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Category Picker Modal */}
      <Portal>
        <Modal
          visible={categoryPickerVisible}
          onDismiss={() => setCategoryPickerVisible(false)}
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
          <Button onPress={() => setCategoryPickerVisible(false)}>Close</Button>
        </Modal>
      </Portal>

      {/* Wallet Modal */}
      <Portal>
        <Modal
          visible={walletModalVisible}
          onDismiss={() => setWalletModalVisible(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleMedium" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
            Select Wallet
          </Text>
          <TextInput
            mode="outlined"
            value={tempWallet}
            onChangeText={setTempWallet}
            placeholder="e.g. Cash, Bank, UPI"
            style={styles.walletInput}
          />
          <View style={styles.modalButtons}>
            <Button onPress={() => setWalletModalVisible(false)}>Cancel</Button>
            <Button mode="contained" onPress={() => {
              setWallet(tempWallet);
              setWalletModalVisible(false);
            }}>Done</Button>
          </View>
        </Modal>
      </Portal>

      {/* Date Picker */}
      {Platform.OS === 'ios' && showDatePicker && (
        <Portal>
          <Modal
            visible={showDatePicker}
            onDismiss={() => setShowDatePicker(false)}
            contentContainerStyle={[styles.dateModal, { backgroundColor: theme.colors.surface }]}
          >
            <Text variant="titleMedium" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              Select Date
            </Text>
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              onChange={(event, date) => {
                if (date) {
                  setSelectedDate(date);
                }
              }}
              style={styles.datePickerIOS}
            />
            <Button onPress={() => setShowDatePicker(false)}>Done</Button>
          </Modal>
        </Portal>
      )}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (event.type !== 'dismissed' && date) {
              setSelectedDate(date);
            }
          }}
        />
      )}
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
    paddingVertical: 8,
  },
  noteInput: {
    minHeight: 36,
    maxHeight: 50,
    textAlignVertical: 'top',
    fontSize: 14,
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
  },
  keypadContainer: {
    padding: 8,
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
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  keypadButton: {
    width: (screenWidth - 48) / 5,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  operatorButton: {
    width: (screenWidth - 48) / 5,
  },
  equalsButton: {
    width: (screenWidth - 48) / 5,
  },
  zeroButton: {
    width: ((screenWidth - 48) / 5) * 2 + 8,
  },
  saveButtonKeypad: {
    width: ((screenWidth - 48) / 5) * 2 + 8,
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
  },
  datePickerIOS: {
    width: '100%',
    height: 200,
  },
  categoryScroll: {
    maxHeight: 300,
    marginTop: 8,
    marginBottom: 8,
  },
  noteInput: {
    marginTop: 8,
    marginBottom: 8,
    minHeight: 100,
  },
  walletInput: {
    marginTop: 8,
    marginBottom: 8,
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

