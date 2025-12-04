import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, IconButton, useTheme } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { AppHeader } from '../../components/AppHeader';
import { getMonthlyIncomeExpenseData, getIncomeBreakdownByCategory } from '../../database';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency } from '../../utils/currencies';
import { useFocusEffect } from '@react-navigation/native';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

const IncomeTrendsReportScreen = () => {
  const theme = useTheme();
  const { currency } = useAppStore();
  const [monthlyData, setMonthlyData] = useState([]);
  const [incomeBreakdown, setIncomeBreakdown] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [monthsToShow, setMonthsToShow] = useState(12);

  const changeYear = (direction) => {
    setSelectedYear(prev => prev + direction);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [monthly, breakdown] = await Promise.all([
        getMonthlyIncomeExpenseData(monthsToShow),
        getIncomeBreakdownByCategory(selectedYear, selectedMonth),
      ]);
      setMonthlyData(monthly);
      setIncomeBreakdown(breakdown);
    } catch (e) {
      console.warn('Failed to load income trends', e);
      setMonthlyData([]);
      setIncomeBreakdown([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [selectedYear, selectedMonth, monthsToShow])
  );

  if (loading) {
    return (
      <>
        <AppHeader showBack title="Income Trends" />
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <Card style={styles.fullCard}>
            <Card.Content>
              <Text style={styles.loadingText}>Loading income trends...</Text>
            </Card.Content>
          </Card>
        </View>
      </>
    );
  }

  const incomeData = monthlyData.map(d => d.income);
  const totalIncome = incomeData.reduce((sum, val) => sum + val, 0);
  const averageIncome = monthlyData.length > 0 ? totalIncome / monthlyData.length : 0;
  const hasData = incomeData.some(v => v > 0);

  const defaultColors = [
    '#1A73E8', '#F4B400', '#34A853', '#E91E63', '#FB8C00',
    '#9C27B0', '#00BCD4', '#FF5722', '#795548', '#607D8B',
  ];

  return (
    <>
      <AppHeader showBack title="Income Trends" />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              monthsToShow === 6 && styles.periodButtonActive,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={() => setMonthsToShow(6)}
          >
            <Text
              style={[
                styles.periodButtonText,
                monthsToShow === 6 && styles.periodButtonTextActive,
                { color: theme.colors.onSurface },
              ]}
            >
              6 Months
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              monthsToShow === 12 && styles.periodButtonActive,
              { backgroundColor: theme.colors.surface },
            ]}
            onPress={() => setMonthsToShow(12)}
          >
            <Text
              style={[
                styles.periodButtonText,
                monthsToShow === 12 && styles.periodButtonTextActive,
                { color: theme.colors.onSurface },
              ]}
            >
              12 Months
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <Card style={[styles.summaryCard, { backgroundColor: '#34A853' }]}>
            <Card.Content>
              <Text style={styles.summaryLabelWhite}>Total Income</Text>
              <Text style={styles.summaryValueWhite}>
                {formatCurrency(totalIncome, currency)}
              </Text>
              <Text style={styles.summarySubtextWhite}>
                Avg: {formatCurrency(averageIncome, currency)}/month
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Income Trend Chart */}
        {hasData && (
          <Card style={[styles.fullCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Title title="Income Trend" />
            <Card.Content>
              <View style={styles.chartContainer}>
                <LineChart
                  data={{
                    labels: monthlyData.map(d => d.monthName),
                    datasets: [
                      {
                        data: incomeData,
                        color: (opacity = 1) => `rgba(52, 168, 83, ${opacity})`,
                        strokeWidth: 2,
                      },
                    ],
                    legend: ['Income'],
                  }}
                  width={screenWidth - 64}
                  height={280}
                  chartConfig={{
                    backgroundColor: theme.colors.surface,
                    backgroundGradientFrom: theme.colors.surface,
                    backgroundGradientTo: theme.colors.surface,
                    decimalPlaces: 0,
                    color: (opacity = 1) =>
                      theme.dark
                        ? `rgba(255, 255, 255, ${opacity})`
                        : `rgba(0, 0, 0, ${opacity})`,
                    labelColor: (opacity = 1) =>
                      theme.dark
                        ? `rgba(255, 255, 255, ${opacity})`
                        : `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                  }}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                  withInnerLines={true}
                  withOuterLines={true}
                  withVerticalLabels={true}
                  withHorizontalLabels={true}
                  withDots={true}
                  withShadow={false}
                  withVerticalLines={false}
                  withHorizontalLines={true}
                  fromZero={true}
                />
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Current Month Income Breakdown */}
        <View style={styles.monthSelector}>
          <IconButton icon="chevron-left" size={24} onPress={() => {
            let newMonth = selectedMonth - 1;
            let newYear = selectedYear;
            if (newMonth < 1) {
              newMonth = 12;
              newYear -= 1;
            }
            setSelectedMonth(newMonth);
            setSelectedYear(newYear);
          }} />
          <TouchableOpacity style={styles.monthLabelContainer}>
            <Text variant="titleMedium" style={[styles.monthLabel, { color: theme.colors.onBackground }]}>
              {new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
            </Text>
          </TouchableOpacity>
          <IconButton icon="chevron-right" size={24} onPress={() => {
            let newMonth = selectedMonth + 1;
            let newYear = selectedYear;
            if (newMonth > 12) {
              newMonth = 1;
              newYear += 1;
            }
            setSelectedMonth(newMonth);
            setSelectedYear(newYear);
          }} />
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
          Income by Source
        </Text>

        {incomeBreakdown.length === 0 ? (
          <Card style={[styles.fullCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.emptyCardContent}>
              <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
                No income data available for this month.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          incomeBreakdown.map((item, index) => {
            const categoryColor = item.color && item.color.trim()
              ? item.color.trim()
              : defaultColors[index % defaultColors.length];
            const totalMonthIncome = incomeBreakdown.reduce((sum, i) => sum + (i.total_amount || 0), 0);
            const percentage = totalMonthIncome > 0
              ? ((item.total_amount / totalMonthIncome) * 100).toFixed(1)
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
                          {percentage}% of monthly income
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
          })
        )}
      </ScrollView>
    </>
  );
};

export default IncomeTrendsReportScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 1,
  },
  periodButtonActive: {
    backgroundColor: '#34A853',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  periodButtonTextActive: {
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
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
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

