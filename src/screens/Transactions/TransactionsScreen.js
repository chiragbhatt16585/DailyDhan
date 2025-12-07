import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, ScrollView, TouchableOpacity, Platform, BackHandler } from 'react-native';
import {
  List,
  Text,
  Searchbar,
  Chip,
  Portal,
  Modal,
  Button,
  RadioButton,
  useTheme,
  IconButton,
  Divider,
  Card,
  Icon,
} from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getDB } from '../../database';
import { AppHeader } from '../../components/AppHeader';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency } from '../../utils/currencies';
import { useFocusEffect } from '@react-navigation/native';

const QUICK_FILTERS = [
  { id: 'today', label: 'Today' },
  { id: 'thisWeek', label: 'This Week' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'last3Months', label: 'Last 3 Months' },
  { id: 'all', label: 'All' },
];

const TransactionsScreen = ({ navigation }) => {
  const theme = useTheme();
  const { currency } = useAppStore();
  const isMountedRef = useRef(true);
  const [allItems, setAllItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuickFilter, setActiveQuickFilter] = useState('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [wallets, setWallets] = useState([]);
  
  // Advanced filters
  const [filterType, setFilterType] = useState('all'); // 'all', 'income', 'expense'
  const [filterCategory, setFilterCategory] = useState(null);
  const [filterWallet, setFilterWallet] = useState(null);
  const [filterStartDate, setFilterStartDate] = useState(null);
  const [filterEndDate, setFilterEndDate] = useState(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Custom back handler that closes modals before navigating
  const handleBackPress = useCallback(() => {
    if (showFilterModal || showStartDatePicker || showEndDatePicker) {
      // Close all modals first
      setShowFilterModal(false);
      setShowStartDatePicker(false);
      setShowEndDatePicker(false);
      // Small delay to ensure modals are fully closed before navigation
      setTimeout(() => {
        if (isMountedRef.current) {
          navigation.goBack();
        }
      }, 100);
    } else {
      navigation.goBack();
    }
  }, [navigation, showFilterModal, showStartDatePicker, showEndDatePicker]);

  // Handle Android hardware back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showFilterModal || showStartDatePicker || showEndDatePicker) {
        // Close modals first
        setShowFilterModal(false);
        setShowStartDatePicker(false);
        setShowEndDatePicker(false);
        return true; // Prevent default back behavior
      }
      return false; // Allow default back behavior
    });

    return () => backHandler.remove();
  }, [showFilterModal, showStartDatePicker, showEndDatePicker]);

  // Ensure modals are closed when leaving this screen to avoid Android ViewGroup errors
  useFocusEffect(
    useCallback(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
        // Close all modals before unmounting
        setShowFilterModal(false);
        setShowStartDatePicker(false);
        setShowEndDatePicker(false);
      };
    }, []),
  );

  // Load categories and wallets
  useEffect(() => {
    const loadCategoriesAndWallets = async () => {
      try {
        const db = await getDB();
        
        // Load categories
        const [categoriesResult] = await db.executeSql(
          'SELECT id, name, type, icon, color FROM categories ORDER BY name ASC'
        );
        const categoryRows = [];
        for (let i = 0; i < categoriesResult.rows.length; i += 1) {
          categoryRows.push(categoriesResult.rows.item(i));
        }
        setCategories(categoryRows);

        // Load wallets
        const [walletsResult] = await db.executeSql(
          'SELECT id, name FROM wallets ORDER BY name ASC'
        );
        const walletRows = [];
        for (let i = 0; i < walletsResult.rows.length; i += 1) {
          walletRows.push(walletsResult.rows.item(i));
        }
        setWallets(walletRows);
      } catch (e) {
        console.warn('Failed to load categories/wallets', e);
      }
    };
    loadCategoriesAndWallets();
  }, []);

  // Load transactions
  const loadTransactions = useCallback(async () => {
      try {
        const db = await getDB();
        const [result] = await db.executeSql(
        `SELECT 
          t.id, 
          t.amount, 
          t.type, 
          t.date, 
          t.note, 
          c.name as category_name,
          c.color as category_color,
          c.icon as category_icon,
          w.name as wallet_name
        FROM transactions t 
        LEFT JOIN categories c ON c.id = t.category_id 
        LEFT JOIN wallets w ON w.id = t.wallet_id
        ORDER BY t.date DESC, t.id DESC`
        );
        const rows = [];
        for (let i = 0; i < result.rows.length; i += 1) {
          rows.push(result.rows.item(i));
        }
      setAllItems(rows);
      } catch (e) {
        console.warn('Failed to load transactions', e);
      }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );

  // Apply filters
  useEffect(() => {
    let filtered = [...allItems];

    // Apply quick date filter
    if (activeQuickFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (activeQuickFilter) {
        case 'today':
          filtered = filtered.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= today;
          });
          break;
        case 'thisWeek':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          filtered = filtered.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= weekStart;
          });
          break;
        case 'thisMonth':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          filtered = filtered.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= monthStart;
          });
          break;
        case 'last3Months':
          const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          filtered = filtered.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= threeMonthsAgo;
          });
          break;
      }
    }

    // Apply advanced date range filter
    if (filterStartDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= filterStartDate;
      });
    }
    if (filterEndDate) {
      const endDate = new Date(filterEndDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate <= endDate;
      });
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }

    // Apply category filter
    if (filterCategory) {
      filtered = filtered.filter(item => item.category_name === filterCategory);
    }

    // Apply wallet filter
    if (filterWallet) {
      filtered = filtered.filter(item => item.wallet_name === filterWallet);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        const amountMatch = String(item.amount).includes(query);
        const noteMatch = item.note?.toLowerCase().includes(query);
        const categoryMatch = item.category_name?.toLowerCase().includes(query);
        return amountMatch || noteMatch || categoryMatch;
      });
    }

    setFilteredItems(filtered);
  }, [allItems, searchQuery, activeQuickFilter, filterType, filterCategory, filterWallet, filterStartDate, filterEndDate]);

  const handleQuickFilter = (filterId) => {
    setActiveQuickFilter(filterId);
    // Clear advanced date filters when using quick filters
    if (filterId !== 'all') {
      setFilterStartDate(null);
      setFilterEndDate(null);
    }
  };

  const clearFilters = () => {
    setActiveQuickFilter('all');
    setFilterType('all');
    setFilterCategory(null);
    setFilterWallet(null);
    setFilterStartDate(null);
    setFilterEndDate(null);
    setSearchQuery('');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (activeQuickFilter !== 'all') count++;
    if (filterType !== 'all') count++;
    if (filterCategory) count++;
    if (filterWallet) count++;
    if (filterStartDate || filterEndDate) count++;
    return count;
  };

  const formatDate = (date) => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTransactionDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderTransactionItem = ({ item }) => {
    const transactionDate = formatTransactionDate(item.date);
    const date = new Date(item.date);
    const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const isIncome = item.type === 'income';
    const categoryColor = item.category_color || (isIncome ? '#34A853' : '#E91E63');
    
    return (
      <Card style={styles.transactionCard} onPress={() => {
        // Navigate to transaction details or edit screen
        // You can implement this later
      }}>
        <Card.Content style={styles.transactionContent}>
          <View style={styles.transactionLeft}>
            <View
              style={[
                styles.transactionIconContainer,
                { backgroundColor: '#F5F5F5' },
              ]}
            >
              <List.Icon
                icon={item.category_icon || (isIncome ? 'arrow-down' : 'arrow-up')}
                color={categoryColor}
                size={20}
              />
            </View>
            <View style={styles.transactionDetails}>
              <View style={styles.transactionCategoryRow}>
                <Text style={styles.transactionCategory}>
                  {item.category_name || (isIncome ? 'Income' : 'Expense')}
                </Text>
                <Text
                  style={[
                    styles.transactionAmount,
                    { color: categoryColor },
                  ]}
                >
                  {isIncome ? '+' : '-'} {formatCurrency(item.amount, currency)}
                </Text>
              </View>
              <Text style={styles.transactionDate}>
                {dateStr} • {timeStr}
              </Text>
              {item.wallet_name && (
                <Text style={styles.transactionWallet}>
                  💳 {item.wallet_name}
                </Text>
              )}
              {item.note ? (
                <Text style={styles.transactionNote} numberOfLines={1}>
                  {item.note}
                </Text>
              ) : null}
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <>
      <AppHeader showBack title="Transactions" onBackPress={handleBackPress} />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Card style={styles.searchCard}>
            <Searchbar
              placeholder="Search by amount, note, or category..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchbar}
              inputStyle={styles.searchInput}
              iconColor={theme.colors.primary}
            />
          </Card>
        </View>

        {/* Quick Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickFiltersContainer}
          contentContainerStyle={styles.quickFiltersContent}
        >
          {QUICK_FILTERS.map(filter => {
            const isActive = activeQuickFilter === filter.id;
            return (
              <TouchableOpacity
                key={filter.id}
                onPress={() => handleQuickFilter(filter.id)}
                activeOpacity={0.7}
                style={[
                  styles.quickFilterChip,
                  isActive && styles.quickFilterChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.quickFilterChipText,
                    isActive && styles.quickFilterChipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Filter Button and Active Filters */}
        <View style={styles.filterHeader}>
          <Button
            mode="outlined"
            icon="filter"
            onPress={() => setShowFilterModal(true)}
            style={styles.filterButton}
            compact
          >
            Filters {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
          </Button>
          {getActiveFiltersCount() > 0 && (
            <Button
              mode="text"
              icon="close"
              onPress={clearFilters}
              compact
              textColor={theme.colors.error}
            >
              Clear
            </Button>
          )}
        </View>

        {/* Active Filter Chips */}
        {(filterType !== 'all' || filterCategory || filterWallet || filterStartDate || filterEndDate) && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.activeFiltersContainer}
            contentContainerStyle={styles.activeFiltersContent}
          >
            {filterType !== 'all' && (
              <Chip
                icon="close"
                onPress={() => setFilterType('all')}
                style={styles.activeFilterChip}
              >
                {filterType === 'income' ? 'Income' : 'Expense'}
              </Chip>
            )}
            {filterCategory && (
              <Chip
                icon="close"
                onPress={() => setFilterCategory(null)}
                style={styles.activeFilterChip}
              >
                {filterCategory}
              </Chip>
            )}
            {filterWallet && (
              <Chip
                icon="close"
                onPress={() => setFilterWallet(null)}
                style={styles.activeFilterChip}
              >
                {filterWallet}
              </Chip>
            )}
            {filterStartDate && (
              <Chip
                icon="close"
                onPress={() => setFilterStartDate(null)}
                style={styles.activeFilterChip}
              >
                From: {formatDate(filterStartDate)}
              </Chip>
            )}
            {filterEndDate && (
              <Chip
                icon="close"
                onPress={() => setFilterEndDate(null)}
                style={styles.activeFilterChip}
              >
                To: {formatDate(filterEndDate)}
              </Chip>
            )}
          </ScrollView>
        )}

        {/* Transactions List */}
        {filteredItems.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="bodyLarge" style={styles.emptyText}>
              {allItems.length === 0
                ? 'No transactions yet. Add your first one from Dashboard.'
                : 'No transactions match your filters.'}
            </Text>
            {getActiveFiltersCount() > 0 && (
              <Button mode="text" onPress={clearFilters} style={styles.clearButton}>
                Clear Filters
              </Button>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={item => String(item.id)}
            renderItem={renderTransactionItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Results Count */}
        {filteredItems.length > 0 && (
          <View style={styles.resultsCount}>
            <Text variant="bodySmall" style={styles.resultsText}>
              Showing {filteredItems.length} of {allItems.length} transactions
            </Text>
          </View>
        )}
      </View>

      {/* Advanced Filter Modal */}
      <Portal>
        <Modal
          visible={showFilterModal}
          onDismiss={() => {
            if (isMountedRef.current) {
              setShowFilterModal(false);
            }
          }}
          contentContainerStyle={[
            styles.modalContainer,
            { backgroundColor: theme.colors.surface },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={styles.modalTitle}>
              Advanced Filters
            </Text>
            <IconButton
              icon="close"
              onPress={() => {
                if (isMountedRef.current) {
                  setShowFilterModal(false);
                }
              }}
              size={24}
            />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Type Filter */}
            <View style={styles.filterSection}>
              <Text variant="titleMedium" style={styles.filterSectionTitle}>
                Transaction Type
              </Text>
              <RadioButton.Group
                onValueChange={setFilterType}
                value={filterType}
              >
                <View style={styles.radioGroup}>
                  <View style={styles.radioOption}>
                    <RadioButton value="all" />
                    <Text onPress={() => setFilterType('all')}>All</Text>
                  </View>
                  <View style={styles.radioOption}>
                    <RadioButton value="income" />
                    <Text onPress={() => setFilterType('income')}>Income</Text>
                  </View>
                  <View style={styles.radioOption}>
                    <RadioButton value="expense" />
                    <Text onPress={() => setFilterType('expense')}>Expense</Text>
                  </View>
                </View>
              </RadioButton.Group>
            </View>

            <Divider style={styles.modalDivider} />

            {/* Category Filter */}
            <View style={styles.filterSection}>
              <Text variant="titleMedium" style={styles.filterSectionTitle}>
                Category
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipGroup}>
                  <Chip
                    selected={!filterCategory}
                    onPress={() => setFilterCategory(null)}
                    style={styles.filterChip}
                  >
                    All
                  </Chip>
                  {categories.map(cat => (
                    <Chip
                      key={cat.id}
                      selected={filterCategory === cat.name}
                      onPress={() =>
                        setFilterCategory(
                          filterCategory === cat.name ? null : cat.name
                        )
                      }
                      style={styles.filterChip}
                    >
                      {cat.name}
                    </Chip>
                  ))}
                </View>
              </ScrollView>
            </View>

            <Divider style={styles.modalDivider} />

            {/* Wallet Filter */}
            {wallets.length > 0 && (
              <>
                <View style={styles.filterSection}>
                  <Text variant="titleMedium" style={styles.filterSectionTitle}>
                    Wallet
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.chipGroup}>
                      <Chip
                        selected={!filterWallet}
                        onPress={() => setFilterWallet(null)}
                        style={styles.filterChip}
                      >
                        All
                      </Chip>
                      {wallets.map(wallet => (
                        <Chip
                          key={wallet.id}
                          selected={filterWallet === wallet.name}
                          onPress={() =>
                            setFilterWallet(
                              filterWallet === wallet.name ? null : wallet.name
                            )
                          }
                          style={styles.filterChip}
                        >
                          {wallet.name}
                        </Chip>
                      ))}
                    </View>
                  </ScrollView>
                </View>
                <Divider style={styles.modalDivider} />
              </>
            )}

            {/* Date Range Filter */}
            <View style={styles.filterSection}>
              <Text variant="titleMedium" style={styles.filterSectionTitle}>
                Date Range
              </Text>
              <List.Item
                title="Start Date"
                description={formatDate(filterStartDate)}
                left={props => <List.Icon {...props} icon="calendar-start" />}
                right={props => (
                  <IconButton
                    {...props}
                    icon="close"
                    size={20}
                    onPress={() => setFilterStartDate(null)}
                    disabled={!filterStartDate}
                  />
                )}
                onPress={() => setShowStartDatePicker(true)}
                style={styles.datePickerItem}
              />
              <List.Item
                title="End Date"
                description={formatDate(filterEndDate)}
                left={props => <List.Icon {...props} icon="calendar-end" />}
                right={props => (
                  <IconButton
                    {...props}
                    icon="close"
                    size={20}
                    onPress={() => setFilterEndDate(null)}
                    disabled={!filterEndDate}
                  />
                )}
                onPress={() => setShowEndDatePicker(true)}
                style={styles.datePickerItem}
              />
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={clearFilters}
              style={styles.modalButton}
            >
              Clear All
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                if (isMountedRef.current) {
                  setShowFilterModal(false);
                }
              }}
              style={styles.modalButton}
            >
              Apply Filters
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Date Pickers - Wrapped in Portal for proper cleanup */}
      <Portal>
        {Platform.OS === 'ios' && showStartDatePicker && (
          <Modal
            visible={showStartDatePicker}
            onDismiss={() => {
              if (isMountedRef.current) {
                setShowStartDatePicker(false);
              }
            }}
            contentContainerStyle={styles.datePickerModal}
          >
            <DateTimePicker
              value={filterStartDate || new Date()}
              mode="date"
              display="spinner"
              onChange={(event, date) => {
                if (isMountedRef.current) {
                  if (date) setFilterStartDate(date);
                  setShowStartDatePicker(false);
                }
              }}
              maximumDate={filterEndDate || new Date()}
            />
            <Button onPress={() => {
              if (isMountedRef.current) {
                setShowStartDatePicker(false);
              }
            }}>Done</Button>
          </Modal>
        )}
      </Portal>

      {Platform.OS === 'android' && showStartDatePicker && (
        <DateTimePicker
          value={filterStartDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            if (isMountedRef.current) {
              if (date) setFilterStartDate(date);
              setShowStartDatePicker(false);
            }
          }}
          maximumDate={filterEndDate || new Date()}
        />
      )}

      <Portal>
        {Platform.OS === 'ios' && showEndDatePicker && (
          <Modal
            visible={showEndDatePicker}
            onDismiss={() => {
              if (isMountedRef.current) {
                setShowEndDatePicker(false);
              }
            }}
            contentContainerStyle={styles.datePickerModal}
          >
            <DateTimePicker
              value={filterEndDate || new Date()}
              mode="date"
              display="spinner"
              onChange={(event, date) => {
                if (isMountedRef.current) {
                  if (date) setFilterEndDate(date);
                  setShowEndDatePicker(false);
                }
              }}
              minimumDate={filterStartDate}
              maximumDate={new Date()}
              />
            <Button onPress={() => {
              if (isMountedRef.current) {
                setShowEndDatePicker(false);
              }
            }}>Done</Button>
          </Modal>
        )}
      </Portal>

      {Platform.OS === 'android' && showEndDatePicker && (
        <DateTimePicker
          value={filterEndDate || new Date()}
          mode="date"
          display="default"
          onChange={(event, date) => {
            if (isMountedRef.current) {
              if (date) setFilterEndDate(date);
              setShowEndDatePicker(false);
            }
          }}
          minimumDate={filterStartDate}
          maximumDate={new Date()}
        />
      )}
    </>
  );
};

export default TransactionsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 12,
  },
  searchCard: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderRadius: 12,
  },
  searchbar: {
    elevation: 0,
    backgroundColor: 'transparent',
    borderRadius: 12,
  },
  searchInput: {
    fontSize: 14,
  },
  quickFiltersContainer: {
    maxHeight: 60,
    marginBottom: 12,
  },
  quickFiltersContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  quickFilterChip: {
    marginRight: 8,
    borderRadius: 20,
    height: 36,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickFilterChipActive: {
    backgroundColor: '#1E4E7C',
    borderColor: '#1E4E7C',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  quickFilterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  quickFilterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  filterButton: {
    flex: 1,
    marginRight: 8,
    borderRadius: 8,
  },
  activeFiltersContainer: {
    maxHeight: 50,
    marginBottom: 12,
  },
  activeFiltersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  activeFilterChip: {
    marginRight: 8,
    borderRadius: 16,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 80,
  },
  transactionCard: {
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  transactionContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionCategoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    color: '#000',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  transactionWallet: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  transactionNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 16,
  },
  clearButton: {
    marginTop: 8,
  },
  resultsCount: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 8,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  resultsText: {
    color: '#666',
  },
  modalContainer: {
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
    padding: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontWeight: '600',
  },
  modalContent: {
    maxHeight: 400,
    padding: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 24,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipGroup: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  filterChip: {
    marginRight: 8,
  },
  modalDivider: {
    marginVertical: 16,
  },
  datePickerItem: {
    paddingVertical: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  datePickerModal: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 16,
  },
});
