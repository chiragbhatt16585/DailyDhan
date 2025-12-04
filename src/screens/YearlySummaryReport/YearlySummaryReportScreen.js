import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, IconButton, useTheme } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { AppHeader } from '../../components/AppHeader';
import { getYearlySummary, getYearlyMonthlyData } from '../../database';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency } from '../../utils/currencies';
import { useFocusEffect } from '@react-navigation/native';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

const YearlySummaryReportScreen = () => {
  const theme = useTheme();
  const { currency } = useAppStore();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0, incomeCount: 0, expenseCount: 0 });
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryData, monthly] = await Promise.all([
        getYearlySummary(selectedYear),
        getYearlyMonthlyData(selectedYear),
      ]);
      setSummary(summaryData);
      setMonthlyData(monthly);
    } catch (e) {
      console.warn('Failed to load yearly summary', e);
      setSummary({ income: 0, expense: 0, balance: 0, incomeCount: 0, expenseCount: 0 });
      setMonthlyData([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [selectedYear])
  );

  const changeYear = (direction) => {
    setSelectedYear(prev => prev + direction);
  };

  if (loading) {
    return (
      <>
        <AppHeader showBack title="Yearly Summary" />
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <Card style={styles.fullCard}>
            <Card.Content>
              <Text style={styles.loadingText}>Loading yearly summary...</Text>
            </Card.Content>
          </Card>
        </View>
      </>
    );
  }

  const incomeData = monthlyData.map(d => d.income);
  const expenseData = monthlyData.map(d => d.expense);
  const hasData = incomeData.some(v => v > 0) || expenseData.some(v => v > 0);

  return (
    <>
      <AppHeader showBack title="Yearly Summary" />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.yearSelector}>
          <IconButton icon="chevron-left" size={24} onPress={() => changeYear(-1)} />
          <TouchableOpacity style={styles.yearLabelContainer}>
            <Text variant="titleLarge" style={[styles.yearLabel, { color: theme.colors.onBackground }]}>
              {selectedYear}
            </Text>
          </TouchableOpacity>
          <IconButton icon="chevron-right" size={24} onPress={() => changeYear(1)} />
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <Card style={[styles.summaryCard, { backgroundColor: '#34A853' }]}>
            <Card.Content>
              <Text style={styles.summaryLabelWhite}>Total Income</Text>
              <Text style={styles.summaryValueWhite}>
                {formatCurrency(summary.income, currency)}
              </Text>
              <Text style={styles.summarySubtextWhite}>
                {summary.incomeCount} transactions
              </Text>
            </Card.Content>
          </Card>
          <Card style={[styles.summaryCard, { backgroundColor: '#E91E63' }]}>
            <Card.Content>
              <Text style={styles.summaryLabelWhite}>Total Expense</Text>
              <Text style={styles.summaryValueWhite}>
                {formatCurrency(summary.expense, currency)}
              </Text>
              <Text style={styles.summarySubtextWhite}>
                {summary.expenseCount} transactions
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

        {/* Monthly Chart */}
        {hasData && (
          <Card style={[styles.fullCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Title title={`Monthly Overview - ${selectedYear}`} />
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
                      {
                        data: expenseData,
                        color: (opacity = 1) => `rgba(233, 30, 99, ${opacity})`,
                        strokeWidth: 2,
                      },
                    ],
                    legend: ['Income', 'Expense'],
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

        {/* Monthly Breakdown */}
        <Card style={[styles.fullCard, { backgroundColor: theme.colors.surface }]}>
          <Card.Title title="Monthly Breakdown" />
          <Card.Content>
            {monthlyData.map((month, index) => {
              const balance = month.income - month.expense;
              return (
                <View key={index} style={styles.monthRow}>
                  <View style={styles.monthInfo}>
                    <Text style={[styles.monthName, { color: theme.colors.onSurface }]}>
                      {month.monthName} {month.year}
                    </Text>
                    <Text style={[styles.monthBalance, { color: theme.colors.onSurface }]}>
                      Balance: {formatCurrency(balance, currency)}
                    </Text>
                  </View>
                  <View style={styles.monthAmounts}>
                    <Text style={[styles.monthAmount, { color: '#34A853' }]}>
                      +{formatCurrency(month.income, currency)}
                    </Text>
                    <Text style={[styles.monthAmount, { color: '#E91E63' }]}>
                      -{formatCurrency(month.expense, currency)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </Card.Content>
        </Card>
      </ScrollView>
    </>
  );
};

export default YearlySummaryReportScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  yearSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingVertical: 8,
  },
  yearLabelContainer: {
    paddingHorizontal: 16,
  },
  yearLabel: {
    fontWeight: '700',
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
  summarySubtextWhite: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.9,
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
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullCard: {
    marginBottom: 16,
    elevation: 2,
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  monthInfo: {
    flex: 1,
  },
  monthName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  monthBalance: {
    fontSize: 12,
  },
  monthAmounts: {
    alignItems: 'flex-end',
  },
  monthAmount: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
});

