import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { List, Text } from 'react-native-paper';
import { getDB } from '../../database';
import { AppHeader } from '../../components/AppHeader';
import { useAppStore } from '../../store/useAppStore';
import { formatCurrency } from '../../utils/currencies';

const TransactionsScreen = ({ navigation }) => {
  const { currency } = useAppStore();
  const [items, setItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const db = await getDB();
        const [result] = await db.executeSql(
          'SELECT t.id, t.amount, t.type, t.date, t.note, c.name as category_name FROM transactions t LEFT JOIN categories c ON c.id = t.category_id ORDER BY t.date DESC',
        );
        const rows = [];
        for (let i = 0; i < result.rows.length; i += 1) {
          rows.push(result.rows.item(i));
        }
        setItems(rows);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to load transactions', e);
      }
    };
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation]);

  return (
    <>
      <AppHeader showBack title="Transactions" />
      <View style={styles.container}>
        {items.length === 0 ? (
          <View style={styles.empty}>
            <Text>No transactions yet. Add your first one from Dashboard.</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => (
              <List.Item
                title={`${item.type === 'income' ? '+' : '-'} ${formatCurrency(item.amount, currency)}`}
                description={item.category_name || item.note || 'No note'}
              />
            )}
          />
        )}
      </View>
    </>
  );
};

export default TransactionsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


