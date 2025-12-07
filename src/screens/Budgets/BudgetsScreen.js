import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import {
  Button,
  Card,
  List,
  Portal,
  Modal,
  RadioButton,
  Text,
  TextInput,
  useTheme,
  IconButton,
  Chip,
  ProgressBar,
  Icon,
} from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { getDB, saveBudget, getBudgets, deleteBudget, getAllBudgets } from '../../database';
import { AppHeader } from '../../components/AppHeader';
import { formatCurrency } from '../../utils/currencies';
import { useAppStore } from '../../store/useAppStore';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const BudgetsScreen = ({ navigation }) => {
  const theme = useTheme();
  const { currency } = useAppStore();
  const isMountedRef = useRef(true);
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [addBudgetModalVisible, setAddBudgetModalVisible] = useState(false);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [periodPickerVisible, setPeriodPickerVisible] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetPeriod, setBudgetPeriod] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingBudget, setEditingBudget] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState('monthly');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadCategories = async () => {
    try {
      const db = await getDB();
      const [result] = await db.executeSql(
        'SELECT id, name, type, icon, color FROM categories WHERE type = ? ORDER BY name ASC',
        ['expense']
      );
      const rows = [];
      for (let i = 0; i < result.rows.length; i += 1) {
        rows.push(result.rows.item(i));
      }
      if (isMountedRef.current) {
        setCategories(rows);
      }
    } catch (e) {
      console.warn('Failed to load categories', e);
    }
  };

  const loadBudgets = async () => {
    try {
      const budgetsList = await getBudgets(filterPeriod, filterYear, filterPeriod === 'monthly' ? filterMonth : null);
      if (isMountedRef.current) {
        setBudgets(budgetsList);
      }
    } catch (e) {
      console.warn('Failed to load budgets', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCategories();
      loadBudgets();
    }, [filterPeriod, filterYear, filterMonth])
  );

  const handleAddBudget = () => {
    setSelectedCategory(null);
    setBudgetAmount('');
    setBudgetPeriod('monthly');
    setSelectedYear(new Date().getFullYear());
    setSelectedMonth(new Date().getMonth() + 1);
    setEditingBudget(null);
    setAddBudgetModalVisible(true);
  };

  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    setSelectedCategory({ id: budget.category_id, name: budget.category_name, icon: budget.category_icon, color: budget.category_color });
    setBudgetAmount(budget.amount.toString());
    setBudgetPeriod(budget.period);
    setSelectedYear(budget.year);
    setSelectedMonth(budget.month || new Date().getMonth() + 1);
    setAddBudgetModalVisible(true);
  };

  const handleSaveBudget = async () => {
    if (!selectedCategory) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (!budgetAmount || isNaN(Number(budgetAmount)) || Number(budgetAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid budget amount');
      return;
    }

    try {
      const amount = Number(budgetAmount);
      const year = selectedYear;
      const month = budgetPeriod === 'monthly' ? selectedMonth : null;

      if (editingBudget) {
        // Delete old budget and create new one (to handle period changes)
        await deleteBudget(editingBudget.id);
      }

      await saveBudget(selectedCategory.id, amount, budgetPeriod, year, month);
      
      if (isMountedRef.current) {
        setAddBudgetModalVisible(false);
        loadBudgets();
      }
    } catch (e) {
      console.warn('Failed to save budget', e);
      Alert.alert('Error', 'Failed to save budget. Please try again.');
    }
  };

  const handleDeleteBudget = (budget) => {
    Alert.alert(
      'Delete Budget',
      `Are you sure you want to delete the budget for ${budget.category_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBudget(budget.id);
              loadBudgets();
            } catch (e) {
              console.warn('Failed to delete budget', e);
              Alert.alert('Error', 'Failed to delete budget. Please try again.');
            }
          },
        },
      ]
    );
  };

  const changeFilterMonth = (direction) => {
    let newMonth = filterMonth + direction;
    let newYear = filterYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    setFilterMonth(newMonth);
    setFilterYear(newYear);
  };

  const changeFilterYear = (direction) => {
    setFilterYear(filterYear + direction);
  };

  const renderBudgetItem = ({ item }) => {
    const percentage = 0; // Will be calculated when we integrate with actual spending
    const isOverBudget = false;

    return (
      <Card style={[styles.budgetCard, { backgroundColor: theme.colors.surface }]}>
        <Card.Content>
          <View style={styles.budgetHeader}>
            <View style={styles.budgetCategoryInfo}>
              <View style={[styles.categoryIconContainer, { backgroundColor: `${item.category_color}20` }]}>
                <List.Icon
                  icon={item.category_icon || (item.type === 'income' ? 'arrow-down' : 'arrow-up')}
                  iconColor={item.category_color || theme.colors.primary}
                  size={20}
                />
              </View>
              <View style={styles.budgetCategoryDetails}>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                  {item.category_name}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {item.period === 'monthly' 
                    ? `${MONTH_NAMES[item.month - 1]} ${item.year}`
                    : `Year ${item.year}`}
                </Text>
              </View>
            </View>
            <View style={styles.budgetActions}>
              <IconButton
                icon="pencil"
                size={20}
                onPress={() => handleEditBudget(item)}
                iconColor={theme.colors.primary}
              />
              <IconButton
                icon="delete"
                size={20}
                onPress={() => handleDeleteBudget(item)}
                iconColor={theme.colors.error}
              />
            </View>
          </View>
          <View style={styles.budgetAmountRow}>
            <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}>
              {formatCurrency(item.amount, currency)}
            </Text>
            <Chip 
              style={[styles.periodChip, { backgroundColor: theme.colors.primary }]}
              textStyle={{ color: '#FFFFFF', fontWeight: '600' }}
              icon={() => <Icon source={item.period === 'monthly' ? 'calendar-month' : 'calendar-range'} size={16} color="#FFFFFF" />}
            >
              {item.period === 'monthly' ? 'Monthly' : 'Yearly'}
            </Chip>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <>
      <AppHeader showBack title="Budget Management" />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Filter Section */}
        <Card style={[styles.filterCard, { backgroundColor: '#FFFFFF' }]}>
          <Card.Content>
            {/* Period Selection */}
            <View style={styles.periodSection}>
              <Text variant="bodySmall" style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
                PERIOD
              </Text>
              <View style={[styles.segmentedControl, { backgroundColor: theme.colors.surfaceVariant }]}>
                <TouchableOpacity
                  style={[
                    styles.segmentedButton,
                    filterPeriod === 'monthly' && [styles.segmentedButtonActive, { backgroundColor: theme.colors.primary }],
                  ]}
                  onPress={() => {
                    setFilterPeriod('monthly');
                    setFilterMonth(new Date().getMonth() + 1);
                  }}
                >
                  <Text
                    style={[
                      styles.segmentedButtonText,
                      filterPeriod === 'monthly' && { color: '#FFFFFF' },
                      filterPeriod !== 'monthly' && { color: theme.colors.onSurface },
                    ]}
                  >
                    Monthly
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.segmentedButton,
                    filterPeriod === 'yearly' && [styles.segmentedButtonActive, { backgroundColor: theme.colors.primary }],
                  ]}
                  onPress={() => {
                    setFilterPeriod('yearly');
                    setFilterMonth(new Date().getMonth() + 1);
                  }}
                >
                  <Text
                    style={[
                      styles.segmentedButtonText,
                      filterPeriod === 'yearly' && { color: '#FFFFFF' },
                      filterPeriod !== 'yearly' && { color: theme.colors.onSurface },
                    ]}
                  >
                    Yearly
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Date Selection */}
            <View style={styles.dateSection}>
              <Text variant="bodySmall" style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
                {filterPeriod === 'monthly' ? 'MONTH & YEAR' : 'YEAR'}
              </Text>
              {filterPeriod === 'monthly' ? (
                <View style={styles.dateSelector}>
                  <IconButton
                    icon="chevron-left"
                    size={24}
                    onPress={() => changeFilterMonth(-1)}
                  />
                  <View style={styles.dateDisplay}>
                    <Text variant="titleLarge" style={[styles.dateText, { color: theme.colors.onSurface }]}>
                      {MONTH_NAMES[filterMonth - 1]}
                    </Text>
                    <Text variant="bodyMedium" style={[styles.yearText, { color: theme.colors.onSurfaceVariant }]}>
                      {filterYear}
                    </Text>
                  </View>
                  <IconButton
                    icon="chevron-right"
                    size={24}
                    onPress={() => changeFilterMonth(1)}
                  />
                </View>
              ) : (
                <View style={styles.dateSelector}>
                  <IconButton
                    icon="chevron-left"
                    size={24}
                    onPress={() => changeFilterYear(-1)}
                  />
                  <Text variant="titleLarge" style={[styles.dateText, { color: theme.colors.onSurface, minWidth: 100, textAlign: 'center' }]}>
                    {filterYear}
                  </Text>
                  <IconButton
                    icon="chevron-right"
                    size={24}
                    onPress={() => changeFilterYear(1)}
                  />
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Budgets List */}
        {budgets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="titleLarge" style={[styles.emptyTitle, { color: theme.colors.onBackground }]}>
              No Budgets Set
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.onBackgroundVariant }]}>
              Create a budget to track your spending and stay on target.
            </Text>
            <Button
              mode="contained"
              onPress={handleAddBudget}
              style={styles.addButton}
              icon="plus"
            >
              Create Budget
            </Button>
          </View>
        ) : (
          <>
            <FlatList
              data={budgets}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderBudgetItem}
              contentContainerStyle={styles.listContent}
              ListFooterComponent={
                <Button
                  mode="outlined"
                  onPress={handleAddBudget}
                  style={styles.addMoreButton}
                  icon="plus"
                >
                  Add Another Budget
                </Button>
              }
            />
          </>
        )}

        {/* Floating Action Button */}
        {budgets.length > 0 && (
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: theme.colors.primary }]}
            onPress={handleAddBudget}
            activeOpacity={0.8}
          >
            <Icon source="plus" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Add/Edit Budget Modal */}
      <Portal>
        <Modal
          visible={addBudgetModalVisible}
          onDismiss={() => setAddBudgetModalVisible(false)}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: '#FFFFFF' }]}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text variant="titleLarge" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              {editingBudget ? 'Edit Budget' : 'Create Budget'}
            </Text>

            {/* Budget Details Section */}
            <View style={[styles.section, { backgroundColor: '#FFFFFF' }]}>
              <Text variant="bodySmall" style={[styles.sectionHeader, { color: theme.colors.onSurface }]}>
                Budget Details
              </Text>
              
              <List.Item
                title="Category"
                description={selectedCategory?.name || 'Not Selected'}
                left={props => <List.Icon {...props} icon="shape" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => setCategoryPickerVisible(true)}
                style={styles.listItem}
              />
            </View>

            {/* Amount & Period Section */}
            <View style={[styles.section, { backgroundColor: '#FFFFFF' }]}>
              <Text variant="bodySmall" style={[styles.sectionHeader, { color: theme.colors.onSurface }]}>
                Amount & Period
              </Text>
              
              <View style={styles.amountInputContainer}>
                <TextInput
                  label={`Amount (${currency.symbol})`}
                  value={budgetAmount}
                  onChangeText={setBudgetAmount}
                  keyboardType="numeric"
                  mode="outlined"
                  style={styles.amountInput}
                />
              </View>

              <List.Item
                title="Period"
                description={budgetPeriod === 'monthly' ? 'Monthly' : 'Yearly'}
                left={props => <List.Icon {...props} icon={budgetPeriod === 'monthly' ? 'calendar-month' : 'calendar-range'} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => setPeriodPickerVisible(true)}
                style={styles.listItem}
              />

              <List.Item
                title={budgetPeriod === 'monthly' ? 'Month' : 'Year'}
                description={
                  budgetPeriod === 'monthly' 
                    ? `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`
                    : `${selectedYear}`
                }
                left={props => <List.Icon {...props} icon="calendar" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => {
                  // Set the date picker to current selected month/year
                  const date = new Date(selectedYear, selectedMonth - 1, 1);
                  setSelectedDate(date);
                  setDatePickerVisible(true);
                }}
                style={styles.listItem}
              />
            </View>

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => setAddBudgetModalVisible(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveBudget}
                style={styles.modalButton}
              >
                {editingBudget ? 'Update' : 'Create'}
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      {/* Category Picker Modal */}
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
            {categories.map(c => (
              <List.Item
                key={c.id}
                title={c.name}
                left={props => (
                  <List.Icon
                    {...props}
                    icon={c.icon || 'wallet'}
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

      {/* Period Picker Modal */}
      <Portal>
        <Modal
          visible={periodPickerVisible}
          onDismiss={() => setPeriodPickerVisible(false)}
          contentContainerStyle={[styles.pickerModal, { backgroundColor: '#FFFFFF' }]}
        >
          <Text variant="titleMedium" style={[styles.pickerModalTitle, { color: theme.colors.onSurface }]}>
            Select Period
          </Text>
          <ScrollView style={styles.pickerScroll}>
            <List.Item
              title="Monthly"
              description="Set a monthly budget"
              left={props => <List.Icon {...props} icon="calendar-month" iconColor={budgetPeriod === 'monthly' ? theme.colors.primary : theme.colors.onSurfaceVariant} />}
              right={props => budgetPeriod === 'monthly' && (
                <List.Icon {...props} icon="check-circle" iconColor={theme.colors.primary} />
              )}
              onPress={() => {
                setBudgetPeriod('monthly');
                setSelectedMonth(new Date().getMonth() + 1);
                setPeriodPickerVisible(false);
              }}
              style={budgetPeriod === 'monthly' ? styles.selectedItem : null}
            />
            <List.Item
              title="Yearly"
              description="Set a yearly budget"
              left={props => <List.Icon {...props} icon="calendar-range" iconColor={budgetPeriod === 'yearly' ? theme.colors.primary : theme.colors.onSurfaceVariant} />}
              right={props => budgetPeriod === 'yearly' && (
                <List.Icon {...props} icon="check-circle" iconColor={theme.colors.primary} />
              )}
              onPress={() => {
                setBudgetPeriod('yearly');
                setSelectedMonth(new Date().getMonth() + 1);
                setPeriodPickerVisible(false);
              }}
              style={budgetPeriod === 'yearly' ? styles.selectedItem : null}
            />
          </ScrollView>
          <Button onPress={() => setPeriodPickerVisible(false)} style={styles.closeButton}>
            Close
          </Button>
        </Modal>
      </Portal>

      {/* Month/Year Picker Modal */}
      <Portal>
        <Modal
          visible={datePickerVisible}
          onDismiss={() => setDatePickerVisible(false)}
          contentContainerStyle={[styles.pickerModal, { backgroundColor: '#FFFFFF' }]}
        >
          <Text variant="titleMedium" style={[styles.pickerModalTitle, { color: theme.colors.onSurface }]}>
            Select {budgetPeriod === 'monthly' ? 'Month & Year' : 'Year'}
          </Text>
          
          {budgetPeriod === 'monthly' ? (
            <ScrollView style={styles.pickerScroll}>
              {/* Year Selection */}
              <View style={styles.yearSelectorContainer}>
                <Text variant="labelLarge" style={[styles.selectorLabel, { color: theme.colors.onSurface }]}>
                  Year
                </Text>
                <View style={styles.yearSelectorRow}>
                  <IconButton
                    icon="chevron-left"
                    size={24}
                    onPress={() => setSelectedYear(selectedYear - 1)}
                  />
                  <Text variant="headlineSmall" style={[styles.yearText, { color: theme.colors.onSurface }]}>
                    {selectedYear}
                  </Text>
                  <IconButton
                    icon="chevron-right"
                    size={24}
                    onPress={() => setSelectedYear(selectedYear + 1)}
                  />
                </View>
              </View>

              {/* Month Selection Grid */}
              <View style={styles.monthGridContainer}>
                <Text variant="labelLarge" style={[styles.selectorLabel, { color: theme.colors.onSurface }]}>
                  Month
                </Text>
                <View style={styles.monthGrid}>
                  {MONTH_NAMES.map((month, index) => {
                    const isSelected = selectedMonth === index + 1;
                    return (
                      <TouchableOpacity
                        key={index}
                        onPress={() => {
                          setSelectedMonth(index + 1);
                        }}
                        style={[
                          styles.monthGridItem,
                          {
                            backgroundColor: isSelected ? theme.colors.primaryContainer : '#F5F5F5',
                            borderColor: isSelected ? theme.colors.primary : '#E0E0E0',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.monthGridText,
                            {
                              color: isSelected ? theme.colors.onPrimaryContainer : theme.colors.onSurface,
                              fontWeight: isSelected ? '600' : '400',
                            },
                          ]}
                        >
                          {month.substring(0, 3)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          ) : (
            <ScrollView style={styles.pickerScroll}>
              <View style={styles.yearSelectorContainer}>
                <Text variant="labelLarge" style={[styles.selectorLabel, { color: theme.colors.onSurface }]}>
                  Year
                </Text>
                <View style={styles.yearSelectorRow}>
                  <IconButton
                    icon="chevron-left"
                    size={24}
                    onPress={() => setSelectedYear(selectedYear - 1)}
                  />
                  <Text variant="headlineSmall" style={[styles.yearText, { color: theme.colors.onSurface }]}>
                    {selectedYear}
                  </Text>
                  <IconButton
                    icon="chevron-right"
                    size={24}
                    onPress={() => setSelectedYear(selectedYear + 1)}
                  />
                </View>
              </View>
            </ScrollView>
          )}
          
          <Button 
            mode="contained"
            onPress={() => setDatePickerVisible(false)}
            style={styles.datePickerButton}
          >
            Done
          </Button>
        </Modal>
      </Portal>
    </>
  );
};

export default BudgetsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
    borderRadius: 12,
  },
  periodSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
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
  dateSection: {
    marginTop: 4,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  dateDisplay: {
    alignItems: 'center',
    minWidth: 150,
    paddingHorizontal: 16,
  },
  dateText: {
    fontWeight: '600',
    marginBottom: 2,
  },
  yearText: {
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  budgetCard: {
    marginBottom: 12,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  budgetCategoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  budgetCategoryDetails: {
    flex: 1,
  },
  budgetActions: {
    flexDirection: 'row',
  },
  budgetAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  periodChip: {
    height: 32,
    borderRadius: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  addButton: {
    marginTop: 16,
  },
  addMoreButton: {
    marginTop: 8,
    marginBottom: 16,
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
  modalContainer: {
    padding: 0,
    margin: 0,
    maxHeight: '100%',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    padding: 20,
    paddingBottom: 16,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
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
  pickerModal: {
    padding: 0,
    margin: 20,
    borderRadius: 12,
    maxHeight: '70%',
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
  datePickerButton: {
    margin: 16,
    marginTop: 8,
  },
  yearSelectorContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  selectorLabel: {
    marginBottom: 12,
    fontWeight: '600',
  },
  yearSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  yearText: {
    minWidth: 100,
    textAlign: 'center',
    fontWeight: '600',
  },
  monthGridContainer: {
    padding: 16,
    paddingTop: 8,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  monthGridItem: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 8,
  },
  monthGridText: {
    fontSize: 12,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  modalButton: {
    minWidth: 120,
  },
});

