import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { FAB, Text, useTheme, Card, List, IconButton, Icon } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import { AppHeader } from '../../components/AppHeader';
import { getMonthlySummary, getDB, getExpenseBreakdownByCategory } from '../../database';
import AdBanner from '../../components/AdBanner';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency } from '../../utils/currencies';

const screenWidth = Dimensions.get('window').width;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DashboardScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const { currency } = useAppStore();
  const [income, setIncome] = useState(0);
  const [expense, setExpense] = useState(0);
  const balance = income - expense;
  const [recent, setRecent] = useState([]);
  const [expenseBreakdown, setExpenseBreakdown] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' or 'categorywise'
  const slideAnim = useRef(new Animated.Value(0)).current;

  const changeMonth = (direction) => {
    let newMonth = selectedMonth + direction;
    let newYear = selectedYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const handleTabChange = (tab) => {
    const toValue = tab === 'transactions' ? 0 : 1;
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: false,
      tension: 68,
      friction: 8,
    }).start();
    setActiveTab(tab);
  };

  useEffect(() => {
    const initialValue = activeTab === 'transactions' ? 0 : 1;
    slideAnim.setValue(initialValue);
  }, []);

  useEffect(() => {
    const load = async () => {
      const summary = await getMonthlySummary(selectedYear, selectedMonth);
      setIncome(summary.income);
      setExpense(summary.expense);

      // Load transactions for selected month
      try {
        const db = await getDB();
        const monthStart = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
        const nextMonth = selectedMonth === 12 ? 1 : selectedMonth + 1;
        const nextYear = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
        const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

        const [result] = await db.executeSql(
          `SELECT t.id,
                  t.amount,
                  t.type,
                  t.date,
                  t.note,
                  c.name AS category_name,
                  c.icon AS category_icon
           FROM transactions t
           LEFT JOIN categories c ON c.id = t.category_id
           WHERE t.date >= ? AND t.date < ?
           ORDER BY t.date DESC
           LIMIT 10`,
          [monthStart, monthEnd],
        );
        const rows = [];
        for (let i = 0; i < result.rows.length; i += 1) {
          rows.push(result.rows.item(i));
        }
        setRecent(rows);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to load recent transactions', e);
      }

      // Load expense breakdown by category
      try {
        const breakdown = await getExpenseBreakdownByCategory(selectedYear, selectedMonth);
        setExpenseBreakdown(breakdown);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to load expense breakdown', e);
      }
    };
    load();
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, selectedYear, selectedMonth]);

  // Default color palette for categories without colors
  const defaultColors = [
    '#1A73E8', // Blue
    '#F4B400', // Gold
    '#34A853', // Green
    '#E91E63', // Pink
    '#FB8C00', // Orange
    '#9C27B0', // Purple
    '#00BCD4', // Cyan
    '#FF5722', // Deep Orange
    '#795548', // Brown
    '#607D8B', // Blue Grey
  ];

  // Prepare pie chart data from expense breakdown
  const pieData = expenseBreakdown.length > 0
    ? expenseBreakdown.map((item, index) => {
        const percentage = expense > 0 ? ((item.total_amount / expense) * 100).toFixed(1) : 0;
        // Use category color if set, otherwise use default color from palette
        const categoryColor = item.color && item.color.trim() 
          ? item.color.trim() 
          : defaultColors[index % defaultColors.length];
        return {
          name: item.name,
          population: item.total_amount,
          color: categoryColor,
          legendFontColor: theme.colors.onBackground || '#000',
          legendFontSize: 12,
          percentage,
        };
      })
    : [
        {
          name: 'No expenses',
          population: 1,
          color: '#CCCCCC',
          legendFontColor: theme.colors.onBackground || '#000',
          legendFontSize: 12,
          percentage: 0,
        },
      ];

  const monthLabel = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;
  const isCurrentMonth =
    selectedYear === new Date().getFullYear() && selectedMonth === new Date().getMonth() + 1;

  return (
    <>
      <AppHeader />
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={[styles.content, { paddingBottom: 80 }]}
      >
        <View style={styles.monthSelector}>
          <IconButton icon="chevron-left" size={24} onPress={() => changeMonth(-1)} />
          <TouchableOpacity style={styles.monthLabelContainer}>
            <Text variant="titleMedium" style={styles.monthLabel}>
              {monthLabel}
            </Text>
          </TouchableOpacity>
          <IconButton icon="chevron-right" size={24} onPress={() => changeMonth(1)} />
        </View>
        {/* Modern Financial Summary Cards - All in One Row */}
        <View style={styles.summaryRow}>
          {/* Income Card */}
          <View style={[styles.financialCard, styles.incomeCard]}>
            <View style={styles.financialCardHeader}>
              <View style={[styles.financialIconContainer, { backgroundColor: '#E8F5E9' }]}>
                <Icon source="arrow-down" size={18} color="#34A853" />
              </View>
              <Text style={styles.financialCardLabel}>Income</Text>
            </View>
            <Text style={styles.financialCardAmount}>{formatCurrency(income, currency)}</Text>
          </View>

          {/* Expense Card */}
          <View style={[styles.financialCard, styles.expenseCard]}>
            <View style={styles.financialCardHeader}>
              <View style={[styles.financialIconContainer, { backgroundColor: '#FCE4EC' }]}>
                <Icon source="arrow-up" size={18} color="#E91E63" />
              </View>
              <Text style={styles.financialCardLabel}>Expense</Text>
            </View>
            <Text style={styles.financialCardAmount}>{formatCurrency(expense, currency)}</Text>
          </View>

          {/* Balance Card */}
          <View style={[styles.financialCard, styles.balanceCardRow, { backgroundColor: balance >= 0 ? '#E8F5E9' : '#FFEBEE' }]}>
            <View style={styles.financialCardHeader}>
              <View style={[styles.financialIconContainer, { backgroundColor: balance >= 0 ? '#34A853' : '#E91E63' }]}>
                <Icon source="wallet" size={18} color="#FFFFFF" />
              </View>
              <Text style={styles.financialCardLabel}>Balance</Text>
            </View>
            <Text style={[styles.financialCardAmount, { color: balance >= 0 ? '#2E7D32' : '#C62828' }]}>
              {formatCurrency(Math.abs(balance), currency)}
            </Text>
          </View>
        </View>

        {/* Expense Breakdown Chart */}
        {expense > 0 && expenseBreakdown.length > 0 && (
          <Card style={styles.fullCard}>
            <Card.Title title="Expense Breakdown" />
            <Card.Content>
              <View style={styles.chartContainer}>
                <PieChart
                  data={pieData}
                  width={screenWidth - 64}
                  height={220}
                  chartConfig={{
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              </View>
              <View style={styles.categoryList}>
                {expenseBreakdown.slice(0, 5).map((item, index) => {
                  const percentage = expense > 0 
                    ? ((item.total_amount / expense) * 100).toFixed(1) 
                    : 0;
                  const categoryColor = item.color && item.color.trim() 
                    ? item.color.trim() 
                    : defaultColors[index % defaultColors.length];
                  return (
                    <View key={item.id} style={styles.categoryItem}>
                      <View
                        style={[styles.categoryColorDot, { backgroundColor: categoryColor }]}
                      />
                      <Text style={styles.categoryName}>
                        {item.name}: {formatCurrency(item.total_amount, currency)} ({percentage}%)
                      </Text>
                    </View>
                  );
                })}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Modern Segmented Control Style Tab Menu */}
        <View style={styles.tabWrapper}>
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={styles.tabButton}
              onPress={() => handleTabChange('transactions')}
              activeOpacity={0.8}
            >
              <Icon
                source="history"
                size={20}
                color={activeTab === 'transactions' ? '#FFFFFF' : '#666'}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === 'transactions' && styles.tabButtonTextActive,
                ]}
              >
                Transactions
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tabButton}
              onPress={() => handleTabChange('categorywise')}
              activeOpacity={0.8}
            >
              <Icon
                source="chart-bar"
                size={20}
                color={activeTab === 'categorywise' ? '#FFFFFF' : '#666'}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  activeTab === 'categorywise' && styles.tabButtonTextActive,
                ]}
              >
                Categories
              </Text>
            </TouchableOpacity>
            {/* Animated Sliding Background Indicator */}
            <Animated.View
              style={[
                styles.tabSlider,
                {
                  transform: [
                    {
                      translateX: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, (screenWidth - 32 - 8) / 2],
                      }),
                    },
                  ],
                },
              ]}
            />
          </View>
        </View>

        {/* Content based on active tab */}
        {activeTab === 'transactions' ? (
          <>
            {recent.length === 0 ? (
              <Card style={styles.fullCard}>
                <Card.Content style={styles.emptyCardContent}>
                  <Text style={styles.emptyText}>No transactions yet.</Text>
                </Card.Content>
              </Card>
            ) : (
              <View style={styles.transactionsContainer}>
                {recent.slice(0, 5).map(item => {
              const date = new Date(item.date);
              const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
              const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
              const isIncome = item.type === 'income';
              
              return (
                <Card key={item.id} style={styles.transactionCard}>
                  <Card.Content style={styles.transactionContent}>
                    <View style={styles.transactionLeft}>
                      <View
                        style={[
                          styles.transactionIconContainer,
                          { backgroundColor: isIncome ? '#E8F5E9' : '#FCE4EC' },
                        ]}
                      >
                        <List.Icon
                          icon={
                            item.category_icon ||
                            (isIncome ? 'arrow-down' : 'arrow-up')
                          }
                          color={isIncome ? '#34A853' : '#E91E63'}
                          size={20}
                        />
                      </View>
                      <View style={styles.transactionDetails}>
                        <View style={styles.transactionCategoryRow}>
                          <Text style={styles.transactionCategory}>
                            {item.category_name || (isIncome ? 'Income' : 'Expense')}
                          </Text>
                          <Text style={styles.transactionAmount}>
                            {isIncome ? '+' : '-'} {formatCurrency(item.amount, currency)}
                          </Text>
                        </View>
                        <Text style={styles.transactionDate}>
                          {dateStr} • {timeStr}
                        </Text>
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
            })}
          </View>
            )}
          </>
        ) : (
          <>
            {expenseBreakdown.length === 0 ? (
              <Card style={styles.fullCard}>
                <Card.Content style={styles.emptyCardContent}>
                  <Text style={styles.emptyText}>No expenses found for this month.</Text>
                </Card.Content>
              </Card>
            ) : (
              <View style={styles.categoriesContainer}>
                {expenseBreakdown.map((item, index) => {
                  const percentage = expense > 0 
                    ? ((item.total_amount / expense) * 100).toFixed(1) 
                    : 0;
                  const categoryColor = item.color && item.color.trim() 
                    ? item.color.trim() 
                    : defaultColors[index % defaultColors.length];

                  return (
                    <Card key={item.id} style={styles.categoryCard}>
                      <Card.Content style={styles.categoryCardContent}>
                        <View style={styles.categoryRow}>
                          <View style={styles.categoryLeft}>
                            <View
                              style={[
                                styles.categoryColorIndicator,
                                { backgroundColor: categoryColor },
                              ]}
                            />
                            <View style={styles.categoryInfo}>
                              <Text style={styles.categoryName}>{item.name}</Text>
                              <Text style={styles.categoryPercentage}>{percentage}% of total</Text>
                            </View>
                          </View>
                          <View style={styles.categoryRight}>
                            <Text style={styles.categoryAmount}>
                              {formatCurrency(item.total_amount, currency)}
                            </Text>
                          </View>
                        </View>
                      </Card.Content>
                    </Card>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
      
      {/* Ad Banner - Fixed at bottom of screen */}
      <View style={styles.fixedAdContainer}>
        <AdBanner />
      </View>
      
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('AddTransaction')}
      />
    </>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  financialCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  incomeCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#34A853',
  },
  expenseCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#E91E63',
  },
  balanceCardRow: {
    borderLeftWidth: 3,
    borderLeftColor: '#1A73E8',
  },
  financialCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  financialIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  financialCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  financialCardAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  chartContainer: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
  },
  fullCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 8,
    fontWeight: '600',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  monthLabelContainer: {
    paddingHorizontal: 16,
  },
  monthLabel: {
    fontWeight: '600',
  },
  categoryList: {
    marginTop: 12,
    marginBottom: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  categoryColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryColorIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  categoryPercentage: {
    fontSize: 12,
    color: '#666',
  },
  categoryAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
  },
  tabWrapper: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 14,
    padding: 4,
    width: '100%',
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    zIndex: 2,
    gap: 8,
  },
  tabButtonActive: {
    // Active state handled by slider background
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
    letterSpacing: 0.2,
  },
  tabButtonTextActive: {
    // Keep active tab text white
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tabSlider: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    width: '48%',
    // Brand color background for the active tab pill
    backgroundColor: '#1E4E7C',
    borderRadius: 12,
    zIndex: 1,
    elevation: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  viewAllButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  viewAllButtonText: {
    color: '#1A73E8',
    fontSize: 14,
    fontWeight: '600',
  },
  transactionsContainer: {
    gap: 8,
    marginBottom: 8,
  },
  transactionCard: {
    marginBottom: 0,
    elevation: 1,
  },
  transactionContent: {
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  transactionDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  transactionNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  emptyCardContent: {
    paddingVertical: 20,
  },
  categoriesContainer: {
    gap: 12,
  },
  categoryCard: {
    marginBottom: 0,
    elevation: 2,
  },
  categoryCardContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  categoryColorIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 12,
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  adContainer: {
    marginTop: 20,
    marginBottom: 16,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  fixedAdContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 80,
  },
});


