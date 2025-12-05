import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { Text, Card, IconButton, useTheme, List, Divider } from 'react-native-paper';
import { PieChart } from 'react-native-chart-kit';
import { AppHeader } from '../../components/AppHeader';
import { getWalletWiseData } from '../../database';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency } from '../../utils/currencies';
import { useFocusEffect } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;

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
          <View style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.emptyCardContent}>
              <Text style={[styles.loadingText, { color: theme.colors.onSurface }]}>Loading wallet data...</Text>
            </View>
          </View>
        </View>
      </>
    );
  }

  const monthLabel = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;
  const totalIncome = walletData.reduce((sum, w) => sum + (w.total_income || 0), 0);
  const totalExpense = walletData.reduce((sum, w) => sum + (w.total_expense || 0), 0);
  const totalBalance = totalIncome - totalExpense;

  // Helper functions for wallet types
  const getWalletIcon = (type) => {
    switch (type) {
      case 'cash': return 'cash';
      case 'bank': return 'bank';
      case 'upi': return 'cellphone';
      case 'credit_card': return 'credit-card';
      default: return 'wallet';
    }
  };

  const getWalletTypeColor = (type) => {
    switch (type) {
      case 'cash': return '#34A853';
      case 'bank': return '#1A73E8';
      case 'upi': return '#9C27B0';
      case 'credit_card': return '#F4B400';
      default: return '#666';
    }
  };

  const getWalletTypeLabel = (type) => {
    switch (type) {
      case 'cash': return 'Cash';
      case 'bank': return 'Bank';
      case 'upi': return 'UPI';
      case 'credit_card': return 'Credit Card';
      default: return 'Wallet';
    }
  };

  // Prepare pie chart data for expense breakdown by wallet
  const pieData = walletData
    .filter(w => (w.total_expense || 0) > 0)
    .map((wallet, index) => {
      const colors = ['#F4B400', '#1A73E8', '#34A853', '#E91E63', '#9C27B0', '#FF9800', '#00BCD4', '#795548'];
      return {
        name: wallet.name.length > 10 ? wallet.name.substring(0, 10) + '...' : wallet.name,
        amount: wallet.total_expense || 0,
        color: getWalletTypeColor(wallet.type) || colors[index % colors.length],
        legendFontColor: '#666',
        legendFontSize: 12,
      };
    });

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
          <View style={[styles.summaryCard, styles.incomeCard]}>
            <View style={styles.summaryCardGradient}>
              <View style={styles.summaryCardContent}>
                <View style={styles.summaryCardHeader}>
                  <View style={styles.summaryIconContainer}>
                    <List.Icon icon="arrow-down" size={22} color="#FFFFFF" />
                  </View>
                  <View style={styles.summaryLabelContainer}>
                    <Text style={styles.summaryLabel} numberOfLines={2}>Total Income</Text>
                  </View>
                </View>
                <Text style={styles.summaryValue}>
                  {formatCurrency(totalIncome, currency)}
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.summaryCard, styles.expenseCard]}>
            <View style={styles.summaryCardGradient}>
              <View style={styles.summaryCardContent}>
                <View style={styles.summaryCardHeader}>
                  <View style={styles.summaryIconContainer}>
                    <List.Icon icon="arrow-up" size={22} color="#FFFFFF" />
                  </View>
                  <View style={styles.summaryLabelContainer}>
                    <Text style={styles.summaryLabel} numberOfLines={2}>Total Expense</Text>
                  </View>
                </View>
                <Text style={styles.summaryValue}>
                  {formatCurrency(totalExpense, currency)}
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.summaryCard, styles.balanceCard, totalBalance >= 0 ? styles.balanceCardPositive : styles.balanceCardNegative]}>
            <View style={styles.summaryCardGradient}>
              <View style={styles.summaryCardContent}>
                <View style={styles.summaryCardHeader}>
                  <View style={styles.summaryIconContainer}>
                    <List.Icon icon="wallet" size={22} color="#FFFFFF" />
                  </View>
                  <View style={styles.summaryLabelContainer}>
                    <Text style={styles.summaryLabel} numberOfLines={2}>Net Balance</Text>
                  </View>
                </View>
                <Text style={styles.summaryValue}>
                  {formatCurrency(Math.abs(totalBalance), currency)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Expense Breakdown Chart */}
        {pieData.length > 0 && (
          <View style={[styles.chartCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.chartCardHeader}>
              <Text style={[styles.chartCardTitle, { color: theme.colors.onSurface }]}>
                Expense by Wallet
              </Text>
            </View>
            <View style={styles.chartContainer}>
              <PieChart
                data={pieData}
                width={screenWidth - 64}
                height={220}
                chartConfig={{
                  color: () => theme.colors.onSurface || '#FFFFFF',
                }}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          </View>
        )}

        <View style={styles.sectionTitleContainer}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            Wallet Breakdown
          </Text>
        </View>

        {walletData.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.emptyCardContent}>
              <Text style={[styles.emptyText, { color: theme.colors.onSurface }]}>
                No wallet transactions found for this month.
              </Text>
            </View>
          </View>
        ) : (
          walletData.map((wallet) => {
            const netBalance = (wallet.total_income || 0) - (wallet.total_expense || 0);
            const walletType = wallet.type || 'cash';
            const walletColor = getWalletTypeColor(walletType);
            const totalAmount = (wallet.total_income || 0) + (wallet.total_expense || 0);
            const incomePercentage = totalAmount > 0 ? ((wallet.total_income || 0) / totalAmount * 100).toFixed(1) : 0;
            const expensePercentage = totalAmount > 0 ? ((wallet.total_expense || 0) / totalAmount * 100).toFixed(1) : 0;
            
            return (
              <View
                key={wallet.id}
                style={[styles.walletCard, { backgroundColor: theme.colors.surface }]}
              >
                <View style={[styles.walletCardHeader, { borderLeftColor: walletColor }]}>
                  <View style={styles.walletHeaderLeft}>
                    <View style={[styles.walletIconContainer, { backgroundColor: walletColor }]}>
                      <List.Icon
                        icon={getWalletIcon(walletType)}
                        color="#FFFFFF"
                        size={24}
                      />
                    </View>
                    <View style={styles.walletHeaderInfo}>
                      <Text style={[styles.walletName, { color: theme.colors.onSurface }]}>
                        {wallet.name}
                      </Text>
                      <View style={styles.walletMeta}>
                        <View style={[styles.walletTypeBadgeContainer, { backgroundColor: walletColor + '15' }]}>
                          <Text style={[styles.walletTypeBadge, { color: walletColor }]}>
                            {getWalletTypeLabel(walletType)}
                          </Text>
                        </View>
                        {wallet.bank_name && (
                          <Text style={[styles.walletMetaText, { color: theme.colors.onSurface }]}> • {wallet.bank_name}</Text>
                        )}
                        {wallet.last_4_digits && (
                          <Text style={[styles.walletMetaText, { color: theme.colors.onSurface }]}> • **** {wallet.last_4_digits}</Text>
                        )}
                      </View>
                      {wallet.transaction_count > 0 && (
                        <Text style={[styles.walletTransactionCount, { color: theme.colors.onSurface }]}>
                          {wallet.transaction_count} transaction{wallet.transaction_count !== 1 ? 's' : ''}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                <View style={styles.walletCardBody}>
                  <View style={styles.walletDetails}>
                    <View style={styles.walletDetailRow}>
                      <View style={[styles.walletDetailItem, styles.incomeDetailItem]}>
                        <View style={styles.walletDetailHeader}>
                          <View style={styles.incomeIconContainer}>
                            <List.Icon icon="arrow-down" size={18} color="#FFFFFF" />
                          </View>
                          <Text style={[styles.walletDetailLabel, { color: '#065F46' }]}>Income</Text>
                        </View>
                        <Text style={[styles.walletDetailValue, { color: '#10B981' }]}>
                          +{formatCurrency(wallet.total_income || 0, currency)}
                        </Text>
                        {totalAmount > 0 && (
                          <Text style={[styles.walletDetailPercentage, { color: '#059669' }]}>
                            {incomePercentage}%
                          </Text>
                        )}
                      </View>
                      <View style={[styles.walletDetailItem, styles.expenseDetailItem]}>
                        <View style={styles.walletDetailHeader}>
                          <View style={styles.expenseIconContainer}>
                            <List.Icon icon="arrow-up" size={18} color="#FFFFFF" />
                          </View>
                          <Text style={[styles.walletDetailLabel, { color: '#991B1B' }]}>Expense</Text>
                        </View>
                        <Text style={[styles.walletDetailValue, { color: '#EF4444' }]}>
                          -{formatCurrency(wallet.total_expense || 0, currency)}
                        </Text>
                        {totalAmount > 0 && (
                          <Text style={[styles.walletDetailPercentage, { color: '#DC2626' }]}>
                            {expensePercentage}%
                          </Text>
                        )}
                      </View>
                    </View>
                    
                    <View style={[styles.walletNetBalance, netBalance >= 0 ? styles.walletNetBalancePositive : styles.walletNetBalanceNegative]}>
                      <View style={styles.walletNetBalanceContent}>
                        <View style={styles.walletNetBalanceLeft}>
                          <Text style={[styles.walletNetBalanceLabel, { color: netBalance >= 0 ? '#065F46' : '#991B1B' }]}>Net Balance</Text>
                          <Text style={[styles.walletNetBalanceSubtext, { color: netBalance >= 0 ? '#059669' : '#DC2626' }]}>
                            {netBalance >= 0 ? 'Positive' : 'Negative'}
                          </Text>
                        </View>
                        <Text style={[styles.walletNetBalanceValue, { color: netBalance >= 0 ? '#10B981' : '#EF4444' }]}>
                          {netBalance >= 0 ? '+' : '-'}{formatCurrency(Math.abs(netBalance), currency)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
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
    marginBottom: 24,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginHorizontal: -4,
  },
  monthLabelContainer: {
    paddingHorizontal: 20,
  },
  monthLabel: {
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  summaryCard: {
    flex: 1,
    minWidth: '30%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  summaryCardGradient: {
    padding: 14,
  },
  incomeCard: {
    backgroundColor: '#10B981',
  },
  expenseCard: {
    backgroundColor: '#EF4444',
  },
  balanceCard: {
    backgroundColor: '#3B82F6',
  },
  balanceCardPositive: {
    backgroundColor: '#10B981',
  },
  balanceCardNegative: {
    backgroundColor: '#EF4444',
  },
  summaryCardContent: {
    minHeight: 80,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  summaryIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  summaryLabelContainer: {
    flex: 1,
    flexShrink: 1,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    opacity: 0.9,
    lineHeight: 14,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  chartCard: {
    marginBottom: 20,
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  chartCardHeader: {
    marginBottom: 16,
  },
  chartCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  chartContainer: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 20,
    letterSpacing: 0.3,
  },
  walletCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  walletCardHeader: {
    padding: 16,
    borderLeftWidth: 4,
    backgroundColor: '#FAFBFC',
  },
  walletHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  walletIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  walletHeaderInfo: {
    flex: 1,
  },
  walletName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  walletMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  walletTypeBadgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6,
  },
  walletTypeBadge: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  walletMetaText: {
    fontSize: 13,
    opacity: 0.7,
  },
  walletTransactionCount: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  walletCardBody: {
    padding: 16,
    paddingTop: 12,
  },
  walletDetails: {
    gap: 14,
  },
  walletDetailRow: {
    flexDirection: 'row',
    gap: 12,
  },
  walletDetailItem: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  incomeDetailItem: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  expenseDetailItem: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  walletDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  incomeIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  expenseIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  walletDetailLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  walletDetailValue: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  walletDetailPercentage: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.6,
    marginTop: 2,
  },
  walletNetBalance: {
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  walletNetBalancePositive: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  walletNetBalanceNegative: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  walletNetBalanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletNetBalanceLeft: {
    flex: 1,
  },
  walletNetBalanceLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    opacity: 0.8,
  },
  walletNetBalanceSubtext: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.6,
  },
  walletNetBalanceValue: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  emptyCard: {
    marginBottom: 16,
    borderRadius: 16,
    padding: 32,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    opacity: 0.6,
    letterSpacing: 0.3,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
    opacity: 0.7,
    letterSpacing: 0.3,
  },
});

