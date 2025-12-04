import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, IconButton, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { AppHeader } from '../../components/AppHeader';
import { getExpenseBreakdownByCategory, getDB } from '../../database';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency } from '../../utils/currencies';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CategoryExpenseReportScreen = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const { currency } = useAppStore();
  const [expenseBreakdown, setExpenseBreakdown] = useState([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

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

  useEffect(() => {
    const load = async () => {
      try {
        const breakdown = await getExpenseBreakdownByCategory(selectedYear, selectedMonth);
        setExpenseBreakdown(breakdown);
        
        // Calculate total expense
        const total = breakdown.reduce((sum, item) => sum + item.total_amount, 0);
        setTotalExpense(total);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to load category expense report', e);
      }
    };
    load();
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, selectedYear, selectedMonth]);

  const monthLabel = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;

  return (
    <>
      <AppHeader showBack title="Category Wise Expense" />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.content}
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

        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.summaryTitle}>
              Total Expense
            </Text>
            <Text variant="headlineMedium" style={styles.summaryAmount}>
              {formatCurrency(totalExpense, currency)}
            </Text>
          </Card.Content>
        </Card>

        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
          Expenses by Category
        </Text>

        {expenseBreakdown.length === 0 ? (
          <Card style={[styles.fullCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.emptyCardContent}>
              <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
                No expenses found for this month.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.categoriesContainer}>
            {expenseBreakdown.map((item, index) => {
              const percentage = totalExpense > 0 
                ? ((item.total_amount / totalExpense) * 100).toFixed(1) 
                : 0;
              const defaultColors = [
                '#1A73E8', '#F4B400', '#34A853', '#E91E63', '#FB8C00',
                '#9C27B0', '#00BCD4', '#FF5722', '#795548', '#607D8B',
              ];
              const categoryColor = item.color && item.color.trim() 
                ? item.color.trim() 
                : defaultColors[index % defaultColors.length];

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
                          <Text
                            style={[styles.categoryPercentage, { color: theme.colors.onSurface }]}
                          >
                            {percentage}% of total
                          </Text>
                        </View>
                      </View>
                      <View style={styles.categoryRight}>
                        <Text style={[styles.categoryAmount, { color: theme.colors.onSurface }]}>
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
      </ScrollView>
    </>
  );
};

export default CategoryExpenseReportScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
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
  summaryCard: {
    marginBottom: 20,
    backgroundColor: '#1A73E8',
  },
  summaryTitle: {
    color: '#FFFFFF',
    marginBottom: 4,
  },
  summaryAmount: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 12,
    fontWeight: '600',
    fontSize: 16,
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
    color: '#000',
  },
  fullCard: {
    marginBottom: 16,
  },
  emptyCardContent: {
    paddingVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
  },
});

