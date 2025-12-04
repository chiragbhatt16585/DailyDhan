import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { AppHeader } from '../../components/AppHeader';
import { getCategoryAnalysis } from '../../database';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency } from '../../utils/currencies';
import { useFocusEffect } from '@react-navigation/native';

const CategoryAnalysisReportScreen = () => {
  const theme = useTheme();
  const { currency } = useAppStore();
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getCategoryAnalysis(50);
      setCategoryData(data);
    } catch (e) {
      console.warn('Failed to load category analysis', e);
      setCategoryData([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  if (loading) {
    return (
      <>
        <AppHeader showBack title="Category Analysis" />
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <Card style={styles.fullCard}>
            <Card.Content>
              <Text style={styles.loadingText}>Loading category analysis...</Text>
            </Card.Content>
          </Card>
        </View>
      </>
    );
  }

  if (categoryData.length === 0) {
    return (
      <>
        <AppHeader showBack title="Category Analysis" />
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
          <Card style={styles.fullCard}>
            <Card.Content>
              <Text style={styles.emptyText}>
                No category data available. Add some transactions to see category analysis.
              </Text>
            </Card.Content>
          </Card>
        </View>
      </>
    );
  }

  const totalExpense = categoryData
    .filter(c => c.type === 'expense')
    .reduce((sum, c) => sum + (c.total_expense || 0), 0);
  const totalIncome = categoryData
    .filter(c => c.type === 'income')
    .reduce((sum, c) => sum + (c.total_income || 0), 0);

  const defaultColors = [
    '#1A73E8', '#F4B400', '#34A853', '#E91E63', '#FB8C00',
    '#9C27B0', '#00BCD4', '#FF5722', '#795548', '#607D8B',
  ];

  return (
    <>
      <AppHeader showBack title="Category Analysis" />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text style={[styles.summaryLabel, { color: theme.colors.onSurface }]}>
                Total Income
              </Text>
              <Text style={[styles.summaryValue, { color: '#34A853' }]}>
                {formatCurrency(totalIncome, currency)}
              </Text>
            </Card.Content>
          </Card>
          <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surface }]}>
            <Card.Content>
              <Text style={[styles.summaryLabel, { color: theme.colors.onSurface }]}>
                Total Expense
              </Text>
              <Text style={[styles.summaryValue, { color: '#E91E63' }]}>
                {formatCurrency(totalExpense, currency)}
              </Text>
            </Card.Content>
          </Card>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
          All Categories
        </Text>

        {categoryData.map((item, index) => {
          const categoryColor = item.color && item.color.trim()
            ? item.color.trim()
            : defaultColors[index % defaultColors.length];
          const total = (item.total_expense || 0) + (item.total_income || 0);
          const percentage = item.type === 'expense' && totalExpense > 0
            ? ((item.total_expense / totalExpense) * 100).toFixed(1)
            : item.type === 'income' && totalIncome > 0
            ? ((item.total_income / totalIncome) * 100).toFixed(1)
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
                      <Text style={[styles.categoryType, { color: theme.colors.onSurface }]}>
                        {item.type === 'income' ? 'Income' : 'Expense'} • {item.transaction_count} transactions
                      </Text>
                    </View>
                  </View>
                  <View style={styles.categoryRight}>
                    {item.type === 'expense' && item.total_expense > 0 && (
                      <Text style={[styles.categoryAmount, { color: '#E91E63' }]}>
                        -{formatCurrency(item.total_expense, currency)}
                      </Text>
                    )}
                    {item.type === 'income' && item.total_income > 0 && (
                      <Text style={[styles.categoryAmount, { color: '#34A853' }]}>
                        +{formatCurrency(item.total_income, currency)}
                      </Text>
                    )}
                    {percentage > 0 && (
                      <Text style={[styles.categoryPercentage, { color: theme.colors.onSurface }]}>
                        {percentage}%
                      </Text>
                    )}
                  </View>
                </View>
              </Card.Content>
            </Card>
          );
        })}
      </ScrollView>
    </>
  );
};

export default CategoryAnalysisReportScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
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
  summaryLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
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
  categoryType: {
    fontSize: 12,
    color: '#666',
  },
  categoryRight: {
    alignItems: 'flex-end',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  categoryPercentage: {
    fontSize: 12,
  },
  fullCard: {
    marginBottom: 16,
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

