import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { AppHeader } from '../../components/AppHeader';
import { getMonthlyIncomeExpenseData } from '../../database';
import { useAppStore } from '../../store/useAppStore';
import { useFocusEffect } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;

const ReportScreen = () => {
  const theme = useTheme();
  const { currency } = useAppStore();
  const [monthlyData, setMonthlyData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMonthlyData = async () => {
    try {
      setLoading(true);
      const data = await getMonthlyIncomeExpenseData(6);
      setMonthlyData(data);
    } catch (e) {
      console.warn('Failed to load monthly chart data', e);
      setMonthlyData([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadMonthlyData();
    }, [])
  );

  if (loading) {
    return (
      <>
        <AppHeader showBack title="Income vs Expense Report" />
        <View style={styles.container}>
          <Card style={styles.fullCard}>
            <Card.Content>
              <Text style={styles.loadingText}>Loading chart data...</Text>
            </Card.Content>
          </Card>
        </View>
      </>
    );
  }

  if (monthlyData.length === 0) {
    return (
      <>
        <AppHeader showBack title="Income vs Expense Report" />
        <View style={styles.container}>
          <Card style={styles.fullCard}>
            <Card.Content>
              <Text style={styles.emptyText}>
                No data available. Add some transactions to see your income vs expense trends.
              </Text>
            </Card.Content>
          </Card>
        </View>
      </>
    );
  }

  const incomeData = monthlyData.map(d => d.income);
  const expenseData = monthlyData.map(d => d.expense);
  const hasData = incomeData.some(v => v > 0) || expenseData.some(v => v > 0);

  if (!hasData) {
    return (
      <>
        <AppHeader showBack title="Income vs Expense Report" />
        <View style={styles.container}>
          <Card style={styles.fullCard}>
            <Card.Content>
              <Text style={styles.emptyText}>
                No income or expense data found for the last 6 months.
              </Text>
            </Card.Content>
          </Card>
        </View>
      </>
    );
  }

  // Calculate totals
  const totalIncome = incomeData.reduce((sum, val) => sum + val, 0);
  const totalExpense = expenseData.reduce((sum, val) => sum + val, 0);
  const averageIncome = totalIncome / monthlyData.length;
  const averageExpense = totalExpense / monthlyData.length;

  return (
    <>
      <AppHeader showBack title="Income vs Expense Report" />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard}>
            <Card.Content>
              <Text style={styles.summaryLabel}>Total Income</Text>
              <Text style={[styles.summaryValue, { color: '#34A853' }]}>
                {currency.symbol}{totalIncome.toFixed(2)}
              </Text>
              <Text style={styles.summarySubtext}>
                Avg: {currency.symbol}{averageIncome.toFixed(2)}/month
              </Text>
            </Card.Content>
          </Card>
          <Card style={styles.summaryCard}>
            <Card.Content>
              <Text style={styles.summaryLabel}>Total Expense</Text>
              <Text style={[styles.summaryValue, { color: '#E91E63' }]}>
                {currency.symbol}{totalExpense.toFixed(2)}
              </Text>
              <Text style={styles.summarySubtext}>
                Avg: {currency.symbol}{averageExpense.toFixed(2)}/month
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Line Chart */}
        <Card style={styles.fullCard}>
          <Card.Title title="Income vs Expense (Last 6 Months)" />
          <Card.Content>
            <View style={styles.chartContainer}>
              <LineChart
                data={{
                  labels: monthlyData.map(d => d.monthName),
                  datasets: [
                    {
                      data: incomeData,
                      color: (opacity = 1) => `rgba(52, 168, 83, ${opacity})`, // Green for income
                      strokeWidth: 2,
                    },
                    {
                      data: expenseData,
                      color: (opacity = 1) => `rgba(233, 30, 99, ${opacity})`, // Pink for expense
                      strokeWidth: 2,
                    },
                  ],
                  legend: ['Income', 'Expense'],
                }}
                width={screenWidth - 64}
                height={280}
                chartConfig={{
                  backgroundColor: '#FFFFFF',
                  backgroundGradientFrom: '#FFFFFF',
                  backgroundGradientTo: '#FFFFFF',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '5',
                    strokeWidth: '2',
                    stroke: '#fff',
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: '', // solid lines
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
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#34A853' }]} />
                <Text style={styles.legendText}>Income</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#E91E63' }]} />
                <Text style={styles.legendText}>Expense</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Monthly Breakdown */}
        <Card style={styles.fullCard}>
          <Card.Title title="Monthly Breakdown" />
          <Card.Content>
            {monthlyData.map((month, index) => {
              const balance = month.income - month.expense;
              return (
                <View key={index} style={styles.monthRow}>
                  <View style={styles.monthInfo}>
                    <Text style={styles.monthName}>{month.monthName} {month.year}</Text>
                    <Text style={styles.monthBalance}>
                      Balance: {currency.symbol}{balance.toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.monthAmounts}>
                    <Text style={[styles.monthAmount, { color: '#34A853' }]}>
                      +{currency.symbol}{month.income.toFixed(2)}
                    </Text>
                    <Text style={[styles.monthAmount, { color: '#E91E63' }]}>
                      -{currency.symbol}{month.expense.toFixed(2)}
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

export default ReportScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  fullCard: {
    marginBottom: 16,
    elevation: 2,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
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
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 11,
    color: '#999',
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
    color: '#666',
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
  emptyText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
    lineHeight: 20,
  },
});

