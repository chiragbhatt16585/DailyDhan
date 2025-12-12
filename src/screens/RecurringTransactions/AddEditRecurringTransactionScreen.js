import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Switch, Modal as RNModal } from 'react-native';
import {
  Button,
  Text,
  TextInput,
  List,
  Portal,
  Modal,
  useTheme,
  Icon,
} from 'react-native-paper';
import { AppHeader } from '../../components/AppHeader';
import { getDB, saveRecurringTransaction } from '../../database';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency } from '../../utils/currencies';

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily', icon: 'calendar-today' },
  { value: 'weekly', label: 'Weekly', icon: 'calendar-week' },
  { value: 'monthly', label: 'Monthly', icon: 'calendar-month' },
  { value: 'yearly', label: 'Yearly', icon: 'calendar-multiple' },
];

const AddEditRecurringTransactionScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const { currency } = useAppStore();
  const recurring = route.params?.recurring || null;
  const isEditing = !!recurring;
  
  const [categories, setCategories] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [frequency, setFrequency] = useState('monthly');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [walletPickerVisible, setWalletPickerVisible] = useState(false);
  const [frequencyPickerVisible, setFrequencyPickerVisible] = useState(false);

  useEffect(() => {
    loadCategories();
    loadWallets();
    
    if (recurring) {
      setAmount(recurring.amount.toString());
      setType(recurring.type);
      setFrequency(recurring.frequency);
      setStartDate(recurring.start_date);
      setNote(recurring.note || '');
      setIsActive(recurring.is_active === 1);
    }
  }, []);

  useEffect(() => {
    if (recurring && categories.length > 0 && wallets.length > 0) {
      const category = categories.find(c => c.id === recurring.category_id);
      const wallet = wallets.find(w => w.id === recurring.wallet_id);
      setSelectedCategory(category || null);
      setSelectedWallet(wallet || null);
    }
  }, [recurring, categories, wallets]);

  const loadCategories = async () => {
    try {
      const db = await getDB();
      const [result] = await db.executeSql(
        'SELECT id, name, type, icon, color FROM categories ORDER BY name ASC'
      );
      const rows = [];
      for (let i = 0; i < result.rows.length; i += 1) {
        rows.push(result.rows.item(i));
      }
      setCategories(rows);
    } catch (e) {
      console.warn('Failed to load categories', e);
    }
  };

  const loadWallets = async () => {
    try {
      const db = await getDB();
      const [result] = await db.executeSql(
        'SELECT id, name, type FROM wallets ORDER BY name ASC'
      );
      const rows = [];
      for (let i = 0; i < result.rows.length; i += 1) {
        rows.push(result.rows.item(i));
      }
      setWallets(rows);
    } catch (e) {
      console.warn('Failed to load wallets', e);
    }
  };

  const handleSave = async () => {
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!selectedWallet) {
      Alert.alert('Error', 'Please select a wallet');
      return;
    }

    try {
      await saveRecurringTransaction({
        id: recurring?.id,
        amount: Number(amount),
        type,
        categoryId: selectedCategory.id,
        walletId: selectedWallet.id,
        frequency,
        startDate,
        note: note.trim(),
        isActive: isActive ? 1 : 0,
      });
      
      navigation.goBack();
    } catch (e) {
      console.warn('Failed to save recurring transaction', e);
      Alert.alert('Error', 'Failed to save recurring transaction. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getFrequencyLabel = (freq) => {
    return FREQUENCY_OPTIONS.find(f => f.value === freq)?.label || freq;
  };

  const filteredCategories = categories.filter(c => c.type === type);

  return (
    <>
      <AppHeader showBack title={isEditing ? 'Edit Recurring Transaction' : 'Create Recurring Transaction'} />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Type Selection */}
          <View style={styles.typeContainer}>
            <View style={[styles.segmentedControl, { backgroundColor: theme.colors.surface }]}>
              <TouchableOpacity
                style={[
                  styles.segmentedButton,
                  type === 'expense' && [styles.segmentedButtonActive, { backgroundColor: theme.colors.primary }],
                ]}
                onPress={() => {
                  setType('expense');
                  setSelectedCategory(null);
                }}
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
                onPress={() => {
                  setType('income');
                  setSelectedCategory(null);
                }}
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

          {/* Transaction Details */}
          <View style={[styles.section, { backgroundColor: '#FFFFFF' }]}>
            <Text variant="bodySmall" style={[styles.sectionHeader, { color: theme.colors.onSurface }]}>
              Transaction Details
            </Text>
            
            <List.Item
              title="Category"
              description={selectedCategory?.name || 'Not Selected'}
              left={props => <List.Icon {...props} icon="shape" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setCategoryPickerVisible(true)}
              style={styles.listItem}
            />

            <List.Item
              title="Wallet"
              description={selectedWallet?.name || 'Not Selected'}
              left={props => <List.Icon {...props} icon="wallet" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setWalletPickerVisible(true)}
              style={styles.listItem}
            />
          </View>

          {/* Amount & Schedule */}
          <View style={[styles.section, { backgroundColor: '#FFFFFF' }]}>
            <Text variant="bodySmall" style={[styles.sectionHeader, { color: theme.colors.onSurface }]}>
              Amount & Schedule
            </Text>
            
            <View style={styles.amountInputContainer}>
              <TextInput
                label={`Amount (${currency.symbol})`}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                mode="outlined"
                style={styles.amountInput}
                autoCorrect={false}
                autoCapitalize="none"
                textContentType="none"
              />
            </View>

            <List.Item
              title="Frequency"
              description={getFrequencyLabel(frequency)}
              left={props => <List.Icon {...props} icon={FREQUENCY_OPTIONS.find(f => f.value === frequency)?.icon || 'repeat'} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setFrequencyPickerVisible(true)}
              style={styles.listItem}
            />

            <List.Item
              title="Start Date"
              description={formatDate(startDate)}
              left={props => <List.Icon {...props} icon="calendar" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              style={styles.listItem}
            />
          </View>

          {/* Note */}
          <View style={[styles.noteSection, { backgroundColor: '#FFFFFF' }]}>
            <View style={styles.noteInputContainer}>
              <TextInput
                mode="outlined"
                value={note}
                onChangeText={setNote}
                placeholder="Add a note (optional)"
                multiline
                numberOfLines={3}
                style={styles.noteInput}
                contentStyle={styles.noteInputContent}
                outlineColor="#E0E0E0"
                activeOutlineColor={theme.colors.primary}
                autoCorrect={false}
                autoCapitalize="sentences"
                textContentType="none"
              />
            </View>
          </View>

          {/* Active Status */}
          <View style={[styles.activeSection, { backgroundColor: '#FFFFFF' }]}>
            <List.Item
              title="Active"
              description={isActive ? 'This recurring transaction is active' : 'This recurring transaction is paused'}
              left={props => <List.Icon {...props} icon={isActive ? 'check-circle' : 'pause-circle'} />}
              right={() => (
                <Switch
                  value={isActive}
                  onValueChange={setIsActive}
                  color={theme.colors.primary}
                />
              )}
              style={styles.listItem}
            />
          </View>

          <View style={styles.actions}>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.actionButton}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.actionButton}
            >
              {isEditing ? 'Update' : 'Create'}
            </Button>
          </View>
        </ScrollView>
      </View>

      {/* Category Picker Modal */}
      {categoryPickerVisible && (
        <Portal>
          <Modal
            visible={categoryPickerVisible}
            onDismiss={() => setCategoryPickerVisible(false)}
            contentContainerStyle={[styles.pickerModal, { backgroundColor: '#FFFFFF' }]}
          >
            <Text variant="titleMedium" style={[styles.pickerModalTitle, { color: theme.colors.onSurface }]}>
              Select Category
            </Text>
            <ScrollView style={styles.pickerScroll}>
              {filteredCategories.map(c => (
                <List.Item
                  key={c.id}
                  title={c.name}
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={c.icon || (c.type === 'income' ? 'arrow-down' : 'arrow-up')}
                      iconColor={c.color}
                    />
                  )}
                  onPress={() => {
                    setSelectedCategory(c);
                    setCategoryPickerVisible(false);
                  }}
                  style={selectedCategory?.id === c.id ? styles.selectedItem : null}
                />
              ))}
            </ScrollView>
            <Button onPress={() => setCategoryPickerVisible(false)} style={styles.closeButton}>
              Close
            </Button>
          </Modal>
        </Portal>
      )}

      {/* Wallet Picker Modal */}
      {walletPickerVisible && (
        <Portal>
          <Modal
            visible={walletPickerVisible}
            onDismiss={() => setWalletPickerVisible(false)}
            contentContainerStyle={[styles.pickerModal, { backgroundColor: '#FFFFFF' }]}
          >
            <Text variant="titleMedium" style={[styles.pickerModalTitle, { color: theme.colors.onSurface }]}>
              Select Wallet
            </Text>
            <ScrollView style={styles.pickerScroll}>
              {wallets.map(w => (
                <List.Item
                  key={w.id}
                  title={w.name}
                  left={props => <List.Icon {...props} icon="wallet" />}
                  right={props => selectedWallet?.id === w.id && (
                    <List.Icon {...props} icon="check-circle" iconColor={theme.colors.primary} />
                  )}
                  onPress={() => {
                    setSelectedWallet(w);
                    setWalletPickerVisible(false);
                  }}
                  style={selectedWallet?.id === w.id ? styles.selectedItem : null}
                />
              ))}
            </ScrollView>
            <Button onPress={() => setWalletPickerVisible(false)} style={styles.closeButton}>
              Close
            </Button>
          </Modal>
        </Portal>
      )}

      {/* Frequency Picker Modal */}
      {frequencyPickerVisible && (
        <Portal>
          <Modal
            visible={frequencyPickerVisible}
            onDismiss={() => setFrequencyPickerVisible(false)}
            contentContainerStyle={[styles.pickerModal, { backgroundColor: '#FFFFFF' }]}
          >
            <Text variant="titleMedium" style={[styles.pickerModalTitle, { color: theme.colors.onSurface }]}>
              Select Frequency
            </Text>
            <ScrollView style={styles.pickerScroll}>
              {FREQUENCY_OPTIONS.map(freq => {
                const isSelected = frequency === freq.value;
                return (
                  <List.Item
                    key={freq.value}
                    title={freq.label}
                    description={
                      freq.value === 'daily' ? 'Transaction will repeat every day' :
                      freq.value === 'weekly' ? 'Transaction will repeat every week' :
                      freq.value === 'monthly' ? 'Transaction will repeat every month' :
                      'Transaction will repeat every year'
                    }
                    left={props => (
                      <List.Icon
                        {...props}
                        icon={freq.icon || 'calendar'}
                        iconColor={isSelected ? theme.colors.primary : theme.colors.onSurfaceVariant}
                      />
                    )}
                    right={props => isSelected && (
                      <List.Icon {...props} icon="check-circle" iconColor={theme.colors.primary} />
                    )}
                    onPress={() => {
                      setFrequency(freq.value);
                      setFrequencyPickerVisible(false);
                    }}
                    style={isSelected ? styles.selectedItem : null}
                  />
                );
              })}
            </ScrollView>
            <Button onPress={() => setFrequencyPickerVisible(false)} style={styles.closeButton}>
              Close
            </Button>
          </Modal>
        </Portal>
      )}
    </>
  );
};

export default AddEditRecurringTransactionScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  typeContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
  },
  segmentedButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentedButtonActive: {
    elevation: 2,
  },
  segmentedButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginTop: 8,
    paddingVertical: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listItem: {
    paddingVertical: 4,
  },
  amountInputContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  amountInput: {
    marginTop: 0,
  },
  noteSection: {
    marginTop: 0,
    paddingTop: 0,
    paddingBottom: 8,
  },
  noteInputContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  noteInput: {
    minHeight: 80,
  },
  noteInputContent: {
    paddingTop: 16,
  },
  activeSection: {
    marginTop: 8,
    paddingVertical: 8,
    paddingBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
    gap: 12,
    paddingHorizontal: 16,
  },
  actionButton: {
    minWidth: 120,
  },
  pickerModal: {
    padding: 0,
    margin: 20,
    borderRadius: 12,
    maxHeight: '70%',
    backgroundColor: '#FFFFFF',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  pickerModalTitle: {
    padding: 20,
    paddingBottom: 16,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  pickerScroll: {
    maxHeight: 400,
  },
  selectedItem: {
    backgroundColor: '#E3F2FD',
  },
  closeButton: {
    margin: 16,
    marginTop: 8,
  },
});

