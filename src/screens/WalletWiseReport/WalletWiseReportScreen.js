import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, IconButton, useTheme } from 'react-native-paper';
import { AppHeader } from '../../components/AppHeader';
import { getWalletWiseData } from '../../database';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency } from '../../utils/currencies';
import { useFocusEffect } from '@react-navigation/native';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WalletWiseReportScreen = () => {
  const theme = useTheme();
  const { currency } = useAppStore();
  const [walletData, setWalletData] = useState([]);
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
      const data = await getWalletWiseData(selectedYear, selectedMonth);
      setWalletData(data);
    } catch (e) {
      console.warn('Failed to load wallet-wise data', e);
      setWalletData([]);
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
        <AppHeader showBack title="Wallet Wise Report" />
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <Card style={styles.fullCard}>
            <Card.Content>
              <Text style={styles.loadingText}>Loading wallet data...</Text>
            </Card.Content>
          </Card>
        </View>
      </>
    );
  }

  const monthLabel = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;
  const totalIncome = walletData.reduce((sum, w) => sum + (w.total_income || 0), 0);
  const totalExpense = walletData.reduce((sum, w) => sum + (w.total_expense || 0), 0);

  return (
    <>
      <AppHeader showBack title="Wallet Wise Report" />
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
                {formatCurrency(totalIncome, currency)}
              </Text>
            </Card.Content>
          </Card>
          <Card style={[styles.summaryCard, { backgroundColor: '#E91E63' }]}>
            <Card.Content>
              <Text style={styles.summaryLabelWhite}>Total Expense</Text>
              <Text style={styles.summaryValueWhite}>
                {formatCurrency(totalExpense, currency)}
              </Text>
            </Card.Content>
          </Card>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
          Wallet Breakdown
        </Text>

        {walletData.length === 0 ? (
          <Card style={[styles.fullCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content style={styles.emptyCardContent}>
              <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
                No wallet transactions found for this month.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          walletData.map((wallet) => {
            const netBalance = (wallet.total_income || 0) - (wallet.total_expense || 0);
            return (
              <Card
                key={wallet.id}
                style={[styles.walletCard, { backgroundColor: theme.colors.surface }]}
              >
                <Card.Content style={styles.walletCardContent}>
                  <Text style={[styles.walletName, { color: theme.colors.onSurface }]}>
                    {wallet.name}
                  </Text>
                  <View style={styles.walletDetails}>
                    <View style={styles.walletDetailItem}>
                      <Text style={[styles.walletDetailLabel, { color: theme.colors.onSurface }]}>
                        Income
                      </Text>
                      <Text style={[styles.walletDetailValue, { color: '#34A853' }]}>
                        +{formatCurrency(wallet.total_income || 0, currency)}
                      </Text>
                    </View>
                    <View style={styles.walletDetailItem}>
                      <Text style={[styles.walletDetailLabel, { color: theme.colors.onSurface }]}>
                        Expense
                      </Text>
                      <Text style={[styles.walletDetailValue, { color: '#E91E63' }]}>
                        -{formatCurrency(wallet.total_expense || 0, currency)}
                      </Text>
                    </View>
                    <View style={styles.walletDetailItem}>
                      <Text style={[styles.walletDetailLabel, { color: theme.colors.onSurface }]}>
                        Net Balance
                      </Text>
                      <Text
                        style={[
                          styles.walletDetailValue,
                          { color: netBalance >= 0 ? '#34A853' : '#E91E63' },
                        ]}
                      >
                        {formatCurrency(Math.abs(netBalance), currency)}
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

export default WalletWiseReportScreen;

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
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 12,
    fontWeight: '600',
    fontSize: 16,
  },
  walletCard: {
    marginBottom: 12,
    elevation: 2,
  },
  walletCardContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  walletName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  walletDetails: {
    gap: 8,
  },
  walletDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  walletDetailLabel: {
    fontSize: 14,
  },
  walletDetailValue: {
    fontSize: 16,
    fontWeight: '600',
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

