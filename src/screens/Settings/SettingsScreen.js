import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { List, Switch, Text, Portal, Modal, TextInput, Searchbar, ActivityIndicator } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeProvider';
import { AppHeader } from '../../components/AppHeader';
import { useAppStore } from '../../store/useAppStore';
import { CURRENCIES } from '../../utils/currencies';
import { useFocusEffect } from '@react-navigation/native';
import { APP_VERSION } from '../../config/version';
import { createDatabaseBackup } from '../../utils/backup';

const SettingsScreen = ({ navigation }) => {
  const { isDark, toggleTheme } = useAppTheme();
  const { currency, setCurrency, initializeCurrency } = useAppStore();
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCurrencies, setFilteredCurrencies] = useState(CURRENCIES);
  const [isBackingUp, setIsBackingUp] = useState(false);

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

  const handleBackupPress = async () => {
    if (isBackingUp) return;

    try {
      setIsBackingUp(true);
      const backupPath = await createDatabaseBackup();
      Alert.alert(
        'Backup created',
        `Your data backup was saved here:\n\n${backupPath}`,
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to create backup', e);
      Alert.alert(
        'Backup failed',
        e?.message || 'Could not create a backup. Please try again.',
      );
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <>
      <AppHeader showBack title="Settings" />
      <View style={styles.container}>
        {/* <List.Item
          title="Dark Mode"
          right={() => <Switch value={isDark} onValueChange={toggleTheme} />}
        />
         */}
        <List.Item
          title="Reports"
          description="View detailed financial reports and analysis"
          onPress={() => {
            // Navigate to ReportsTab to switch to the Reports tab
            navigation.getParent()?.navigate('ReportsTab');
          }}
          left={props => <List.Icon {...props} icon="file-chart" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
        <List.Item
          title="Manage Categories"
          description="Add or edit income and expense categories"
          onPress={() => navigation.navigate('Categories')}
          left={props => <List.Icon {...props} icon="shape" />}
        />
        
        <List.Item
          title="Currency"
          description={`${currency.symbol} ${currency.name} (${currency.code})`}
          onPress={() => setCurrencyModalVisible(true)}
          left={props => <List.Icon {...props} icon="currency-usd" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
        <List.Item
          title="Affiliate Programme"
          description="Manage your affiliate accounts and links"
          onPress={() => navigation.navigate('AffiliateAccounts')}
          left={props => <List.Icon {...props} icon="link-variant" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />

      <List.Item
          title="Backup data"
          description={isBackingUp ? 'Creating backup...' : 'Save a backup of your data to device storage'}
          onPress={handleBackupPress}
          left={props => <List.Icon {...props} icon="cloud-upload" />}
          right={props =>
            isBackingUp ? (
              <ActivityIndicator animating size="small" />
            ) : (
              <List.Icon {...props} icon="chevron-right" />
            )
          }
        />
        <View style={styles.footer}>
          <Text variant="bodySmall">DailyDhan · Track Today, Save for Tomorrow</Text>
          <Text variant="bodySmall" style={styles.versionText}>
            Version {APP_VERSION}
          </Text>
        </View>
      </View>

      <Portal>
        <Modal
          visible={currencyModalVisible}
          onDismiss={() => {
            setCurrencyModalVisible(false);
            setSearchQuery('');
          }}
          contentContainerStyle={styles.modalContainer}
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
                  </View>
                  {isSelected && (
                    <List.Icon icon="check-circle" iconColor="#34A853" />
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No currencies found</Text>
              </View>
            }
          />
        </Modal>
      </Portal>
    </>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  footer: {
    marginTop: 'auto',
    padding: 16,
    alignItems: 'center',
  },
  versionText: {
    marginTop: 8,
    color: '#999',
    fontSize: 11,
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
    marginBottom: 12,
    elevation: 0,
  },
  currencyList: {
    maxHeight: 400,
  },
  currencyItem: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    marginRight: 16,
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
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
});


