import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Button, RadioButton, Text, TextInput, List, Portal, Modal } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getDB } from '../../database';
import { AppHeader } from '../../components/AppHeader';
import { useFocusEffect } from '@react-navigation/native';
import { useAppStore } from '../../store/useAppStore';

const AddTransactionScreen = ({ navigation }) => {
  const { currency } = useAppStore();
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [categoryId, setCategoryId] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [wallet, setWallet] = useState('');
  const [note, setNote] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  const onSave = async () => {
    if (!amount) {
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
        [Number(amount), type, categoryIdToUse, walletId, selectedDate.toISOString(), note],
      );

      navigation.goBack();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to save transaction', e);
    }
  };

  return (
    <>
      <AppHeader showBack title="Add Transaction" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="titleMedium" style={styles.label}>
          Amount
        </Text>
        <TextInput
          mode="outlined"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          placeholder={`Enter amount in ${currency.symbol}`}
        />

        <Text variant="titleMedium" style={styles.label}>
          Type
        </Text>
        <RadioButton.Group onValueChange={setType} value={type}>
          <View style={styles.row}>
            <RadioButton value="expense" />
            <Text style={styles.radioLabel}>Expense</Text>
            <RadioButton value="income" />
            <Text style={styles.radioLabel}>Income</Text>
          </View>
        </RadioButton.Group>

        <Text variant="titleMedium" style={styles.label}>
          Category
        </Text>
        <Button
          mode="outlined"
          onPress={() => setCategoryPickerVisible(true)}
          style={styles.inputButton}
        >
          {categoryName || 'Select Category'}
        </Button>

        <Text variant="titleMedium" style={styles.label}>
          Date
        </Text>
        <Button
          mode="outlined"
          onPress={() => setShowDatePicker(true)}
          style={styles.inputButton}
          icon="calendar"
        >
          {selectedDate.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </Button>

        <Text variant="titleMedium" style={styles.label}>
          Wallet
        </Text>
        <TextInput
          mode="outlined"
          value={wallet}
          onChangeText={setWallet}
          placeholder="e.g. Cash, Bank, UPI"
        />

        <Text variant="titleMedium" style={styles.label}>
          Note (Optional)
        </Text>
        <TextInput
          mode="outlined"
          value={note}
          onChangeText={setNote}
          placeholder="Add a note about this transaction..."
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
          style={styles.noteInput}
        />

        <Button mode="contained" style={styles.saveButton} onPress={onSave}>
          Save Transaction
        </Button>
      </ScrollView>
      <Portal>
        <Modal
          visible={categoryPickerVisible}
          onDismiss={() => setCategoryPickerVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleMedium" style={styles.modalTitle}>
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
      {Platform.OS === 'ios' && showDatePicker && (
        <Portal>
          <Modal
            visible={showDatePicker}
            onDismiss={() => setShowDatePicker(false)}
            contentContainerStyle={styles.dateModal}
          >
            <Text variant="titleMedium" style={styles.modalTitle}>
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
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  label: {
    marginTop: 8,
  },
  inputButton: {
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioLabel: {
    marginRight: 16,
  },
  saveButton: {
    marginTop: 24,
  },
  modal: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
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
    backgroundColor: 'white',
  },
  datePickerIOS: {
    width: '100%',
    height: 200,
  },
  noteInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  categoryScroll: {
    maxHeight: 300,
    marginTop: 8,
    marginBottom: 8,
  },
});


