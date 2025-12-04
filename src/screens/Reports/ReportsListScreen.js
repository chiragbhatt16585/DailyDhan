import React from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Text } from 'react-native-paper';
import { AppHeader } from '../../components/AppHeader';

const REPORTS = [
  {
    id: 'income-vs-expense',
    title: 'Income vs Expense',
    description: 'Monthly income and expense trends with line chart',
    icon: 'chart-line',
    screen: 'IncomeExpenseReport',
  },
  {
    id: 'category-wise-expense',
    title: 'Category Wise Expense',
    description: 'View expenses grouped by category for any month',
    icon: 'chart-pie',
    screen: 'CategoryExpenseReport',
  },
  // Add more reports here in the future
  // {
  //   id: 'category-analysis',
  //   title: 'Category Analysis',
  //   description: 'Detailed analysis of spending by category',
  //   icon: 'chart-bar',
  //   screen: 'CategoryAnalysisReport',
  // },
  // {
  //   id: 'yearly-summary',
  //   title: 'Yearly Summary',
  //   description: 'Complete financial summary for the year',
  //   icon: 'calendar-year',
  //   screen: 'YearlySummaryReport',
  // },
];

const ReportsListScreen = ({ navigation }) => {
  return (
    <>
      <AppHeader showBack title="Reports" />
      <View style={styles.container}>
        {REPORTS.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No Reports Available
            </Text>
            <Text style={styles.emptyText}>
              Reports will be available here once configured.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text variant="bodyMedium" style={styles.headerDescription}>
                Select a report to view detailed analysis
              </Text>
            </View>
            {REPORTS.map((report) => (
              <List.Item
                key={report.id}
                title={report.title}
                description={report.description}
                left={props => <List.Icon {...props} icon={report.icon} />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => navigation.navigate(report.screen)}
                style={styles.reportItem}
              />
            ))}
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
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerDescription: {
    color: '#666',
  },
  reportItem: {
    backgroundColor: '#FFFFFF',
    marginBottom: 1,
    paddingVertical: 4,
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

