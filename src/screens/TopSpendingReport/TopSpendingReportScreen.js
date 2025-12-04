import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, IconButton, useTheme } from 'react-native-paper';
import { PieChart } from 'react-native-chart-kit';
import { AppHeader } from '../../components/AppHeader';
import { getTopSpendingCategories } from '../../database';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency } from '../../utils/currencies';
import { useFocusEffect } from '@react-navigation/native';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

const TopSpendingReportScreen = () => {
  const theme = useTheme();
  const { currency } = useAppStore();
  const [topCategories, setTopCategories] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'all'

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
      const data = viewMode === 'month'
        ? await getTopSpendingCategories(10, selectedYear, selectedMonth)
        : await getTopSpendingCategories(10);
      setTopCategories(data);
    } catch (e) {
      console.warn('Failed to load top spending categories', e);
      setTopCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [selectedYear, selectedMonth, viewMode])
  );

  if (loading) {
    return (
      <>
        <AppHeader showBack title="Top Spending Categories" />
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <Card style={styles.fullCard}>
            <Card.Content>
              <Text style={styles.loadingText}>Loading top spending data...</Text>
            </Card.Content>
          </Card>
        </View>
      </>
    );
  }

  const totalSpending = topCategories.reduce((sum, c) => sum + (c.total_amount || 0), 0);
  const defaultColors = [
    '#1A73E8', '#F4B400', '#34A853', '#E91E63', '#FB8C00',
    '#9C27B0', '#00BCD4', '#FF5722', '#795548', '#607D8B',
  ];

  const pieData = topCategories.length > 0
    ? topCategories.map((item, index) => {
        const categoryColor = item.color && item.color.trim()
          ? item.color.trim()
          : defaultColors[index % defaultColors.length];
        const percentage = totalSpending > 0
          ? ((item.total_amount / totalSpending) * 100).toFixed(1)
          : 0;
        return {
          name: item.name,
          population: item.total_amount,
          color: categoryColor,
          legendFontColor: theme.colors.onSurface || '#FFFFFF',
          legendFontSize: 12,
          percentage,
        };
      })
    : [];

  return (
    <>
      <AppHeader showBack title="Top Spending Categories" />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* View Mode Toggle */}
        <View style={styles.viewModeContainer}>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === 'month' && styles.viewModeButtonActive,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={() => setViewMode('month')}
          >
            <Text
              style={[
                styles.viewModeText,
                viewMode === 'month' && styles.viewModeTextActive,
                { color: theme.colors.onSurface },
              ]}
            >
              This Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === 'all' && styles.viewModeButtonActive,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={() => setViewMode('all')}
          >
            <Text
              style={[
                styles.viewModeText,
                viewMode === 'all' && styles.viewModeTextActive,
                { color: theme.colors.onSurface },
              ]}
            >
              All Time
            </Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'month' && (
          <View style={styles.monthSelector}>
            <IconButton icon="chevron-left" size={24} onPress={() => changeMonth(-1)} />
            <TouchableOpacity style={styles.monthLabelContainer}>
              <Text variant="titleMedium" style={[styles.monthLabel, { color: theme.colors.onBackground }]}>
                {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </Text>
            </TouchableOpacity>
            <IconButton icon="chevron-right" size={24} onPress={() => changeMonth(1)} />
          </View>
        )}

        {/* Summary Card */}
        <Card style={[styles.summaryCard, { backgroundColor: '#E91E63' }]}>
          <Card.Content>
            <Text style={styles.summaryLabelWhite}>Total Spending</Text>
            <Text style={styles.summaryValueWhite}>
              {formatCurrency(totalSpending, currency)}
            </Text>
            <Text style={styles.summarySubtextWhite}>
              {topCategories.length} categories
            </Text>
          </Card.Content>
        </Card>

        {/* Pie Chart */}
        {topCategories.length > 0 && (
          <Card style={[styles.fullCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Title title="Spending Distribution" />
            <Card.Content>
              <View style={styles.chartContainer}>
                <PieChart
                  data={pieData}
                  width={screenWidth - 64}
                  height={220}
                  chartConfig={{
                    color: () => theme.colors.onSurface || '#FFFFFF',
                  }}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  absolute
                />
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Category List */}
        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
          Top Categories
        </Text>

        {topCategories.length === 0 ? (
          <Card style={[styles.fullCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.emptyCardContent}>
              <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
                No spending data available.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          topCategories.map((item, index) => {
            const categoryColor = item.color && item.color.trim()
              ? item.color.trim()
              : defaultColors[index % defaultColors.length];
            const percentage = totalSpending > 0
              ? ((item.total_amount / totalSpending) * 100).toFixed(1)
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
                          #{index + 1} {item.name}
                        </Text>
                        <Text style={[styles.categoryPercentage, { color: theme.colors.onSurface }]}>
                          {percentage}% of total • {item.transaction_count} transactions
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
          })
        )}
      </ScrollView>
    </>
  );
};

export default TopSpendingReportScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  viewModeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 1,
  },
  viewModeButtonActive: {
    backgroundColor: '#1A73E8',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
  },
  viewModeTextActive: {
    color: '#FFFFFF',
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
  summaryCard: {
    marginBottom: 20,
    elevation: 2,
  },
  summaryLabelWhite: {
    fontSize: 12,
    marginBottom: 4,
    color: '#FFFFFF',
  },
  summaryValueWhite: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summarySubtextWhite: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
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

