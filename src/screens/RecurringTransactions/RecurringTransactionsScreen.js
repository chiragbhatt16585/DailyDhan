import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert, Switch } from 'react-native';
import {
  Button,
  Card,
  List,
  Text,
  useTheme,
  IconButton,
  Chip,
  Icon,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getDB, saveRecurringTransaction, getAllRecurringTransactions, deleteRecurringTransaction, toggleRecurringTransactionStatus, processDueRecurringTransactions } from '../../database';
import { AppHeader } from '../../components/AppHeader';
import { formatCurrency } from '../../utils/currencies';
import { useAppStore } from '../../store/useAppStore';

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Daily', icon: 'calendar-today' },
  { value: 'weekly', label: 'Weekly', icon: 'calendar-week' },
  { value: 'monthly', label: 'Monthly', icon: 'calendar-month' },
  { value: 'yearly', label: 'Yearly', icon: 'calendar-multiple' },
];

const RecurringTransactionsScreen = ({ navigation }) => {
  const theme = useTheme();
  const { currency } = useAppStore();
  const isMountedRef = useRef(true);
  const [recurringTransactions, setRecurringTransactions] = useState([]);



  // No custom back handler - let React Navigation handle it naturally
  // Modals will close on unmount via useFocusEffect

  useFocusEffect(
    useCallback(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
      };
    }, []),
  );


  const loadRecurringTransactions = async () => {
    try {
      const transactions = await getAllRecurringTransactions();
      // Use setTimeout to ensure we're not updating during unmount
      setTimeout(() => {
        if (isMountedRef.current) {
          setRecurringTransactions(transactions);
        }
      }, 0);
    } catch (e) {
      console.warn('Failed to load recurring transactions', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRecurringTransactions();
    }, [])
  );

  const handleAddRecurring = () => {
    navigation.navigate('AddEditRecurringTransaction');
  };

  const handleEditRecurring = (recurring) => {
    navigation.navigate('AddEditRecurringTransaction', { recurring });
  };


  const handleDeleteRecurring = (recurring) => {
    Alert.alert(
      'Delete Recurring Transaction',
      `Are you sure you want to delete this recurring ${recurring.type}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecurringTransaction(recurring.id);
              loadRecurringTransactions();
            } catch (e) {
              console.warn('Failed to delete recurring transaction', e);
              Alert.alert('Error', 'Failed to delete recurring transaction. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleToggleStatus = async (recurring) => {
    try {
      await toggleRecurringTransactionStatus(recurring.id, recurring.is_active === 0);
      loadRecurringTransactions();
    } catch (e) {
      console.warn('Failed to toggle status', e);
      Alert.alert('Error', 'Failed to update status. Please try again.');
    }
  };

  const handleProcessDue = async () => {
    try {
      const created = await processDueRecurringTransactions();
      if (created.length > 0) {
        Alert.alert(
          'Success',
          `Created ${created.length} transaction(s) from recurring templates.`,
          [{ text: 'OK' }]
        );
        loadRecurringTransactions();
      } else {
        Alert.alert('Info', 'No recurring transactions are due at this time.');
      }
    } catch (e) {
      console.warn('Failed to process due transactions', e);
      Alert.alert('Error', 'Failed to process due transactions. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getFrequencyLabel = (freq) => {
    return FREQUENCY_OPTIONS.find(f => f.value === freq)?.label || freq;
  };

  const renderRecurringItem = ({ item }) => {
    const isDue = new Date(item.next_due_date) <= new Date();
    const isActive = item.is_active === 1;
    const typeColor = item.type === 'income' ? '#34A853' : '#E91E63';
    const frequencyOption = FREQUENCY_OPTIONS.find(f => f.value === item.frequency);

    return (
      <Card 
        style={[
          styles.recurringCard, 
          { 
            backgroundColor: '#FFFFFF',
            borderLeftWidth: 4,
            borderLeftColor: typeColor,
            opacity: isActive ? 1 : 0.6,
          }
        ]}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.recurringHeader}>
            <View style={styles.recurringCategoryInfo}>
              <View style={[styles.categoryIconContainer, { backgroundColor: '#F5F5F5' }]}>
                <List.Icon 
                  icon={item.category_icon || 'wallet'} 
                  iconColor={item.category_color || theme.colors.primary}
                  size={20}
                />
              </View>
              <View style={styles.recurringCategoryDetails}>
                <Text variant="titleMedium" style={[styles.categoryName, { color: theme.colors.onSurface }]}>
                  {item.category_name || 'Uncategorized'}
                </Text>
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Icon source="wallet" size={12} color={theme.colors.onSurfaceVariant} />
                    <Text variant="bodySmall" style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                      {item.wallet_name || 'No wallet'}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Icon source={frequencyOption?.icon || 'repeat'} size={12} color={theme.colors.onSurfaceVariant} />
                    <Text variant="bodySmall" style={[styles.metaText, { color: theme.colors.onSurfaceVariant }]}>
                      {getFrequencyLabel(item.frequency)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <Switch
              value={isActive}
              onValueChange={() => handleToggleStatus(item)}
              color={theme.colors.primary}
            />
          </View>

          <View style={styles.amountSection}>
            <View style={styles.amountRow}>
              <View style={styles.amountContainer}>
                <Text variant="headlineSmall" style={[styles.amountText, { color: typeColor }]}>
                  {item.type === 'income' ? '+' : '-'} {formatCurrency(item.amount, currency)}
                </Text>
                <View style={styles.dateRow}>
                  <Icon source="calendar-clock" size={14} color={theme.colors.onSurfaceVariant} />
                  <Text variant="bodySmall" style={[styles.dateText, { color: theme.colors.onSurfaceVariant }]}>
                    Next: {formatDate(item.next_due_date)}
                  </Text>
                  {isDue && (
                    <Chip 
                      icon="alert-circle" 
                      style={styles.dueChip}
                      textStyle={styles.dueChipText}
                      compact
                    >
                      Due
                    </Chip>
                  )}
                </View>
              </View>
              <View style={styles.actionButtons}>
                <IconButton
                  icon="pencil"
                  size={18}
                  onPress={() => handleEditRecurring(item)}
                  iconColor={theme.colors.primary}
                  style={styles.actionButton}
                />
                <IconButton
                  icon="delete-outline"
                  size={18}
                  onPress={() => handleDeleteRecurring(item)}
                  iconColor={theme.colors.error}
                  style={styles.actionButton}
                />
              </View>
            </View>
          </View>

          {item.note && (
            <View style={styles.noteContainer}>
              <Icon source="note-text" size={14} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodySmall" style={[styles.noteText, { color: theme.colors.onSurfaceVariant }]}>
                {item.note}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };


  return (
    <>
      <AppHeader showBack title="Recurring Transactions" />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Process Due Button - Modern Design */}
        {recurringTransactions.length > 0 && (
          <View style={styles.processDueContainer}>
            <TouchableOpacity onPress={handleProcessDue} activeOpacity={0.7}>
              <Card style={[styles.actionCard, { backgroundColor: '#FFFFFF' }]}>
                <Card.Content style={styles.actionCardContent}>
                  <View style={styles.actionCardIcon}>
                    <Icon source="refresh" size={24} color={theme.colors.primary} />
                  </View>
                  <View style={styles.actionCardText}>
                    <Text variant="titleMedium" style={[styles.actionCardTitle, { color: theme.colors.onSurface }]}>
                      Process Due Transactions
                    </Text>
                    <Text variant="bodySmall" style={[styles.actionCardSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                      Create transactions for all due items
                    </Text>
                  </View>
                  <Icon source="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
                </Card.Content>
              </Card>
            </TouchableOpacity>
          </View>
        )}

        {/* Recurring Transactions List */}
        {recurringTransactions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Icon source="repeat" size={64} color={theme.colors.onSurfaceVariant} />
            </View>
            <Text variant="titleLarge" style={[styles.emptyTitle, { color: theme.colors.onBackground }]}>
              No Recurring Transactions
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.onBackgroundVariant }]}>
              Set up recurring transactions to automatically create income or expenses on a schedule.
            </Text>
            <Button
              mode="contained"
              onPress={handleAddRecurring}
              style={styles.addButton}
              icon="plus"
              contentStyle={styles.addButtonContent}
            >
              Create Recurring Transaction
            </Button>
          </View>
        ) : (
          <FlatList
            data={recurringTransactions}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderRecurringItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={false}
          />
        )}

        {/* Floating Action Button */}
        {recurringTransactions.length > 0 && (
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: theme.colors.primary }]}
            onPress={handleAddRecurring}
            activeOpacity={0.8}
          >
            <Icon source="plus" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>


    </>
  );
};

export default RecurringTransactionsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  processDueContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  actionCard: {
    elevation: 2,
    borderRadius: 12,
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  actionCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionCardText: {
    flex: 1,
  },
  actionCardTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  actionCardSubtitle: {
    fontSize: 12,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 80,
  },
  recurringCard: {
    marginBottom: 12,
    elevation: 2,
    borderRadius: 12,
  },
  cardContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  recurringHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  recurringCategoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recurringCategoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontWeight: '600',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
  },
  amountSection: {
    marginTop: 4,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  amountContainer: {
    flex: 1,
  },
  amountText: {
    fontWeight: '700',
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
  },
  dueChip: {
    height: 20,
    backgroundColor: '#FFEBEE',
    marginLeft: 8,
  },
  dueChipText: {
    color: '#C62828',
    fontSize: 10,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  actionButton: {
    margin: 0,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 8,
  },
  noteText: {
    flex: 1,
    fontSize: 12,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    marginBottom: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  addButton: {
    borderRadius: 12,
  },
  addButtonContent: {
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});

