import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { List, Text, Portal, Modal, Searchbar, useTheme } from 'react-native-paper';
import { AppHeader } from '../../components/AppHeader';
import { useAppStore } from '../../store/useAppStore';
import { CURRENCIES } from '../../utils/currencies';

const MasterDataScreen = ({ navigation }) => {
  const theme = useTheme();
  const { currency, setCurrency, initializeCurrency } = useAppStore();
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCurrencies, setFilteredCurrencies] = useState(CURRENCIES);

  // Initialize currency on mount
  useEffect(() => {
    initializeCurrency();
  }, [initializeCurrency]);

  // Filter currencies based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCurrencies(CURRENCIES);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = CURRENCIES.filter(
        c =>
          c.name.toLowerCase().includes(query) ||
          c.code.toLowerCase().includes(query) ||
          c.country.toLowerCase().includes(query) ||
          c.symbol.toLowerCase().includes(query)
      );
      setFilteredCurrencies(filtered);
    }
  }, [searchQuery]);

  const handleCurrencySelect = async (selectedCurrency) => {
    await setCurrency(selectedCurrency);
    setCurrencyModalVisible(false);
    setSearchQuery('');
  };

  return (
    <>
      <AppHeader showBack title="Master Data" />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <List.Item
          title="Manage Categories"
          description="Add or edit income and expense categories"
          onPress={() => navigation.navigate('Categories')}
          left={props => <List.Icon {...props} icon="shape" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
        
        <List.Item
          title="Manage Wallets"
          description="Add, edit or delete your wallets"
          onPress={() => navigation.navigate('Wallets')}
          left={props => <List.Icon {...props} icon="wallet" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
        
        <List.Item
          title="Currency"
          description={`${currency.symbol} ${currency.name} (${currency.code})`}
          onPress={() => setCurrencyModalVisible(true)}
          left={props => <List.Icon {...props} icon="currency-usd" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
      </View>

      {/* Currency Selection Modal */}
      <Portal>
        <Modal
          visible={currencyModalVisible}
          onDismiss={() => {
            setCurrencyModalVisible(false);
            setSearchQuery('');
          }}
          contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Select Currency
          </Text>
          <Searchbar
            placeholder="Search currency..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
          <FlatList
            data={filteredCurrencies}
            keyExtractor={item => item.code}
            style={styles.currencyList}
            renderItem={({ item }) => {
              const isSelected = currency.code === item.code;
              return (
                <TouchableOpacity
                  onPress={() => handleCurrencySelect(item)}
                  style={[
                    styles.currencyItem,
                    isSelected && styles.currencyItemSelected,
                  ]}
                >
                  <View style={styles.currencyItemContent}>
                    <Text style={styles.currencySymbol}>{item.symbol}</Text>
                    <View style={styles.currencyInfo}>
                      <Text style={styles.currencyName}>{item.name}</Text>
                      <Text style={styles.currencyDetails}>
                        {item.code} · {item.country}
                      </Text>
                    </View>
                    {isSelected && (
                      <List.Icon icon="check-circle" iconColor={theme.colors.primary} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </Modal>
      </Portal>
    </>
  );
};

export default MasterDataScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    maxHeight: '80%',
    padding: 16,
  },
  modalTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  searchbar: {
    marginBottom: 16,
    elevation: 0,
  },
  currencyList: {
    maxHeight: 400,
  },
  currencyItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  currencyItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  currencyItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    marginRight: 12,
    minWidth: 40,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  currencyDetails: {
    fontSize: 12,
    color: '#666',
  },
});

