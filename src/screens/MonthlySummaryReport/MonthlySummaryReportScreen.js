import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, IconButton, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { AppHeader } from '../../components/AppHeader';
import { getMonthlySummary, getExpenseBreakdownByCategory, getIncomeBreakdownByCategory } from '../../database';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency } from '../../utils/currencies';
import { useFocusEffect } from '@react-navigation/native';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MonthlySummaryReportScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const { currency } = useAppStore();
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [expenseBreakdown, setExpenseBreakdown] = useState([]);
  const [incomeBreakdown, setIncomeBreakdown] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);

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

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryData, expenses, incomes] = await Promise.all([
        getMonthlySummary(selectedYear, selectedMonth),
        getExpenseBreakdownByCategory(selectedYear, selectedMonth),
        getIncomeBreakdownByCategory(selectedYear, selectedMonth),
      ]);
      setSummary(summaryData);
      setExpenseBreakdown(expenses);
      setIncomeBreakdown(incomes);
    } catch (e) {
      console.warn('Failed to load monthly summary', e);
      setSummary({ income: 0, expense: 0, balance: 0 });
      setExpenseBreakdown([]);
      setIncomeBreakdown([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [selectedYear, selectedMonth])
  );

  if (loading) {
    return (
      <>
        <AppHeader showBack title="Monthly Summary" />
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <Card style={styles.fullCard}>
            <Card.Content>
              <Text style={styles.loadingText}>Loading monthly summary...</Text>
            </Card.Content>
          </Card>
        </View>
      </>
    );
  }

  const monthLabel = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;
  const defaultColors = [
    '#1A73E8', '#F4B400', '#34A853', '#E91E63', '#FB8C00',
    '#9C27B0', '#00BCD4', '#FF5722', '#795548', '#607D8B',
  ];

  return (
    <>
      <AppHeader showBack title="Monthly Summary" />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.monthSelector}>
          <IconButton icon="chevron-left" size={24} onPress={() => changeMonth(-1)} />
          <TouchableOpacity style={styles.monthLabelContainer}>
            <Text variant="titleMedium" style={[styles.monthLabel, { color: theme.colors.onBackground }]}>
              {monthLabel}
            </Text>
          </TouchableOpacity>
          <IconButton icon="chevron-right" size={24} onPress={() => changeMonth(1)} />
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <Card style={[styles.summaryCard, { backgroundColor: '#34A853' }]}>
            <Card.Content>
              <Text style={styles.summaryLabelWhite}>Total Income</Text>
              <Text style={styles.summaryValueWhite}>
                {formatCurrency(summary.income, currency)}
              </Text>
            </Card.Content>
          </Card>
          <Card style={[styles.summaryCard, { backgroundColor: '#E91E63' }]}>
            <Card.Content>
              <Text style={styles.summaryLabelWhite}>Total Expense</Text>
              <Text style={styles.summaryValueWhite}>
                {formatCurrency(summary.expense, currency)}
              </Text>
            </Card.Content>
          </Card>
        </View>

        <Card style={[styles.balanceCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text style={[styles.balanceLabel, { color: theme.colors.onSurface }]}>
              Net Balance
            </Text>
            <Text
              style={[
                styles.balanceValue,
                { color: summary.balance >= 0 ? '#34A853' : '#E91E63' },
              ]}
            >
              {formatCurrency(Math.abs(summary.balance), currency)}
            </Text>
          </Card.Content>
        </Card>

        {/* Income Breakdown */}
        {incomeBreakdown.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
              Income by Category
            </Text>
            {incomeBreakdown.map((item, index) => {
              const categoryColor = item.color && item.color.trim()
                ? item.color.trim()
                : defaultColors[index % defaultColors.length];
              const percentage = summary.income > 0
                ? ((item.total_amount / summary.income) * 100).toFixed(1)
                : 0;

              return (
                <Card
                  key={item.id}
                  style={[styles.categoryCard, { backgroundColor: theme.colors.surface }]}
                >
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
                          <Text style={[styles.categoryName, { color: theme.colors.onSurface }]}>
                            {item.name}
                          </Text>
                          <Text style={[styles.categoryPercentage, { color: theme.colors.onSurface }]}>
                            {percentage}% of total
                          </Text>
                        </View>
                      </View>
                      <View style={styles.categoryRight}>
                        <Text style={[styles.categoryAmount, { color: '#34A853' }]}>
                          {formatCurrency(item.total_amount, currency)}
                        </Text>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              );
            })}
          </>
        )}

        {/* Expense Breakdown */}
        {expenseBreakdown.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
              Expenses by Category
            </Text>
            {expenseBreakdown.map((item, index) => {
              const categoryColor = item.color && item.color.trim()
                ? item.color.trim()
                : defaultColors[index % defaultColors.length];
              const percentage = summary.expense > 0
                ? ((item.total_amount / summary.expense) * 100).toFixed(1)
                : 0;

              return (
                <Card
                  key={item.id}
                  style={[styles.categoryCard, { backgroundColor: theme.colors.surface }]}
                >
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
                          <Text style={[styles.categoryName, { color: theme.colors.onSurface }]}>
                            {item.name}
                          </Text>
                          <Text style={[styles.categoryPercentage, { color: theme.colors.onSurface }]}>
                            {percentage}% of total
                          </Text>
                        </View>
                      </View>
                      <View style={styles.categoryRight}>
                        <Text style={[styles.categoryAmount, { color: '#E91E63' }]}>
                          {formatCurrency(item.total_amount, currency)}
                        </Text>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              );
            })}
          </>
        )}

        {incomeBreakdown.length === 0 && expenseBreakdown.length === 0 && (
          <Card style={[styles.fullCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.emptyCardContent}>
              <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
                No transactions found for this month.
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </>
  );
};

export default MonthlySummaryReportScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingVertical: 8,
  },
  monthLabelContainer: {
    paddingHorizontal: 16,
  },
  monthLabel: {
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    elevation: 2,
  },
  summaryLabelWhite: {
    fontSize: 12,
    marginBottom: 4,
    color: '#FFFFFF',
  },
  summaryValueWhite: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  balanceCard: {
    marginBottom: 20,
    elevation: 2,
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 12,
    fontWeight: '600',
    fontSize: 16,
  },
  categoryCard: {
    marginBottom: 12,
    elevation: 2,
  },
  categoryCardContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
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
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 18,
    fontWeight: '700',
  },
  fullCard: {
    marginBottom: 16,
    elevation: 2,
  },
  emptyCardContent: {
    paddingVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
});

