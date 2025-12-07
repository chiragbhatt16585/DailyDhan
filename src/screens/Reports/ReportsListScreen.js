import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { List, Text, useTheme, Icon } from 'react-native-paper';
import { AppHeader } from '../../components/AppHeader';
import { useAppStore } from '../../store/useAppStore';
import { ENABLE_PREMIUM_FEATURES } from '../../config/premium';

const REPORTS = [
  {
    id: 'income-vs-expense',
    title: 'Income vs Expense',
    description: 'Monthly income and expense trends with line chart',
    icon: 'chart-line',
    screen: 'IncomeExpenseReport',
    isPremium: false, // Free
  },
  {
    id: 'category-wise-expense',
    title: 'Category Wise Expense',
    description: 'View expenses grouped by category for any month',
    icon: 'chart-pie',
    screen: 'CategoryExpenseReport',
    isPremium: false, // Free
  },
  {
    id: 'monthly-summary',
    title: 'Monthly Summary',
    description: 'Detailed monthly financial overview and trends',
    icon: 'calendar-month',
    screen: 'MonthlySummaryReport',
    isPremium: false, // Free
  },
  {
    id: 'category-analysis',
    title: 'Category Analysis',
    description: 'Detailed analysis of spending by category',
    icon: 'chart-bar',
    screen: 'CategoryAnalysisReport',
    isPremium: true, // Premium
  },
  {
    id: 'yearly-summary',
    title: 'Yearly Summary',
    description: 'Complete financial summary for the year',
    icon: 'calendar-range',
    screen: 'YearlySummaryReport',
    isPremium: true, // Premium
  },
  {
    id: 'wallet-wise',
    title: 'Wallet Wise Report',
    description: 'Track income and expenses by wallet (Cash, Bank, UPI, etc.)',
    icon: 'wallet',
    screen: 'WalletWiseReport',
    isPremium: true, // Premium
  },
  {
    id: 'top-spending',
    title: 'Top Spending Categories',
    description: 'See your highest spending categories and trends',
    icon: 'trending-up',
    screen: 'TopSpendingReport',
    isPremium: true, // Premium
  },
  {
    id: 'income-trends',
    title: 'Income Trends',
    description: 'Analyze your income patterns and sources over time',
    icon: 'chart-timeline-variant',
    screen: 'IncomeTrendsReport',
    isPremium: true, // Premium
  },
];

const ReportsListScreen = ({ navigation }) => {
  const theme = useTheme();
  const { isPremium } = useAppStore();
  // If premium features are disabled, treat all users as premium
  const effectiveIsPremium = !ENABLE_PREMIUM_FEATURES || isPremium;

  const handleReportPress = (report) => {
    // Check if report is premium and user doesn't have premium
    if (ENABLE_PREMIUM_FEATURES && report.isPremium && !isPremium) {
      Alert.alert(
        'Premium Feature',
        `${report.title} is available in DailyDhan Premium. Upgrade to unlock all premium reports and features.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Upgrade to Premium',
            onPress: () => {
              // Navigate to Premium screen
              // Premium is now also in ReportsStack, so we can navigate directly
              navigation.navigate('Premium');
            },
          },
        ]
      );
      return;
    }
    
    // Navigate to report if free or user has premium
    navigation.navigate(report.screen);
  };

  return (
    <>
      <AppHeader showBack title="Reports" />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {REPORTS.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="titleMedium" style={[styles.emptyTitle, { color: theme.colors.onBackground }]}>
              No Reports Available
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.onBackground }]}>
              Reports will be available here once configured.
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
              <Text variant="bodyMedium" style={[styles.headerDescription, { color: theme.colors.onSurface }]}>
                Select a report to view detailed analysis
              </Text>
            </View>
            {REPORTS.map((report) => {
              const isLocked = ENABLE_PREMIUM_FEATURES && report.isPremium && !isPremium;
              return (
                <List.Item
                  key={report.id}
                  title={report.title}
                  description={report.description}
                  left={props => (
                    <List.Icon 
                      {...props} 
                      icon={report.icon}
                      iconColor={isLocked ? theme.colors.onSurfaceVariant : theme.colors.primary}
                    />
                  )}
                  right={props => (
                    <View style={styles.rightContainer}>
                      {isLocked && (
                        <Icon source="lock" size={20} color={theme.colors.onSurfaceVariant} style={styles.lockIcon} />
                      )}
                      <List.Icon {...props} icon="chevron-right" />
                    </View>
                  )}
                  onPress={() => handleReportPress(report)}
                  style={[
                    styles.reportItem, 
                    { backgroundColor: theme.colors.surface },
                    isLocked && styles.lockedItem,
                  ]}
                  disabled={false}
                />
              );
            })}
          </>
        )}
      </View>
    </>
  );
};

export default ReportsListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerDescription: {
  },
  reportItem: {
    marginBottom: 1,
    paddingVertical: 4,
  },
  lockedItem: {
    opacity: 0.7,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockIcon: {
    marginRight: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
  },
});


