import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { List, Switch, Text, Portal, Modal, TextInput, Searchbar, ActivityIndicator, Button, useTheme } from 'react-native-paper';
import { useAppTheme } from '../../theme/ThemeProvider';
import { AppHeader } from '../../components/AppHeader';
import { useAppStore } from '../../store/useAppStore';
import { useFocusEffect } from '@react-navigation/native';
import { APP_VERSION } from '../../config/version';
import { createDatabaseBackup, shareBackupToDrive, getAvailableBackups, restoreDatabaseFromBackup, pickBackupFile } from '../../utils/backup';
import { ENABLE_PREMIUM_FEATURES } from '../../config/premium';

const SettingsScreen = ({ navigation }) => {
  const { isDark, toggleTheme } = useAppTheme();
  const theme = useTheme();
  const { isPremium } = useAppStore();
  // If premium features are disabled, treat all users as premium
  const effectiveIsPremium = !ENABLE_PREMIUM_FEATURES || isPremium;
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupLocationModalVisible, setBackupLocationModalVisible] = useState(false);
  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [restoreLocationModalVisible, setRestoreLocationModalVisible] = useState(false);
  const [availableBackups, setAvailableBackups] = useState([]);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);


  const handleBackupPress = async () => {
    // TODO: Re-enable premium check after testing
    // Check if user has premium
    // if (!isPremium) {
    //   Alert.alert(
    //     'Premium Feature',
    //     'Data backup is available in DailyDhan Premium. Upgrade to unlock this feature and protect your data.',
    //     [
    //       { text: 'Cancel', style: 'cancel' },
    //       {
    //         text: 'Upgrade to Premium',
    //         onPress: () => navigation.navigate('Premium'),
    //       },
    //     ]
    //   );
    //   return;
    // }

    // Show backup location selection
    setBackupLocationModalVisible(true);
  };

  const handleBackupToDevice = async () => {
    setBackupLocationModalVisible(false);
    if (isBackingUp) return;

    try {
      setIsBackingUp(true);
      const backupPath = await createDatabaseBackup();
      
      // Extract readable path for user
      const readablePath = backupPath.includes('Download') 
        ? 'Downloads/DailyDhanBackups folder'
        : backupPath.split('/').slice(-2).join('/');
      
      Alert.alert(
        'Backup created',
        `Your data backup was saved successfully!\n\nLocation: ${readablePath}\n\nFile: ${backupPath.split('/').pop()}\n\nYou can find it in:\n- Downloads folder (via file manager)\n- Or use "Restore data" to access it`,
        [{ text: 'OK' }]
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

  const handleBackupToGoogleDrive = async () => {
    setBackupLocationModalVisible(false);
    if (isBackingUp) return;

    try {
      setIsBackingUp(true);
      // First create backup locally
      const backupPath = await createDatabaseBackup();
      
      // Then share to Google Drive or other cloud storage
      const shared = await shareBackupToDrive(backupPath);
      
      if (shared) {
        Alert.alert(
          'Backup shared',
          'Your backup has been shared. You can save it to Google Drive or any other cloud storage.',
          [{ text: 'OK' }]
        );
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to backup to Google Drive', e);
      Alert.alert(
        'Backup failed',
        e?.message || 'Could not upload backup to Google Drive. Please try again.',
      );
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestorePress = async () => {
    // TODO: Re-enable premium check after testing
    // Check if user has premium
    // if (!isPremium) {
    //   Alert.alert(
    //     'Premium Feature',
    //     'Data restore is available in DailyDhan Premium. Upgrade to unlock this feature.',
    //     [
    //       { text: 'Cancel', style: 'cancel' },
    //       {
    //         text: 'Upgrade to Premium',
    //         onPress: () => navigation.navigate('Premium'),
    //       },
    //     ]
    //   );
    //   return;
    // }

    // Show restore location selection
    setRestoreLocationModalVisible(true);
  };

  const handleRestoreFromLocal = async () => {
    setRestoreLocationModalVisible(false);
    
    // Load available backups from local storage
    try {
      setIsLoadingBackups(true);
      const backups = await getAvailableBackups();
      setAvailableBackups(backups);
      
      if (backups.length === 0) {
        Alert.alert(
          'No Local Backups',
          'No backup files found in local storage. Would you like to select a backup file from Google Drive or other locations?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Select File',
              onPress: handleRestoreFromFilePicker,
            },
          ]
        );
        return;
      }
      
      setRestoreModalVisible(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to load backup files. Please try again.');
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleRestoreFromFilePicker = async () => {
    setRestoreLocationModalVisible(false);
    
    try {
      setIsRestoring(true);
      const backupPath = await pickBackupFile();
      
      if (!backupPath) {
        // User cancelled
        return;
      }
      
      // Extract filename from path
      const backupName = backupPath.split('/').pop() || 'Selected backup';
      
      // Show confirmation and restore
      Alert.alert(
        'Restore Data',
        `Are you sure you want to restore from "${backupName}"?\n\nThis will replace your current data with the backup. Your current data will be saved as a safety backup.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Restore',
            style: 'destructive',
            onPress: async () => {
              try {
                await restoreDatabaseFromBackup(backupPath);
                Alert.alert(
                  'Restore Successful',
                  'Your data has been restored successfully. Please restart the app to see the restored data.',
                  [{ text: 'OK' }]
                );
              } catch (error) {
                Alert.alert(
                  'Restore Failed',
                  error.message || 'Failed to restore data. Please try again.',
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error.message || 'Failed to select backup file. Please try again.',
      );
    } finally {
      setIsRestoring(false);
    }
  };

  const handleRestoreFromBackup = async (backupPath, backupName) => {
    setRestoreModalVisible(false);
    
    Alert.alert(
      'Restore Data',
      `Are you sure you want to restore from "${backupName}"?\n\nThis will replace your current data with the backup. Your current data will be saved as a safety backup.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            if (isRestoring) return;
            
            try {
              setIsRestoring(true);
              await restoreDatabaseFromBackup(backupPath);
              Alert.alert(
                'Restore Successful',
                'Your data has been restored successfully. Please restart the app to see the restored data.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Optionally restart the app or reload data
                    },
                  },
                ]
              );
            } catch (error) {
              Alert.alert(
                'Restore Failed',
                error.message || 'Failed to restore data. Please try again.',
              );
            } finally {
              setIsRestoring(false);
            }
          },
        },
      ]
    );
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
          title="Master Data"
          description="Manage categories, wallets, and currency settings"
          onPress={() => navigation.navigate('MasterData')}
          left={props => <List.Icon {...props} icon="database" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
        
        <List.Item
          title="Budget Management"
          description="Set and track budgets for your categories"
          onPress={() => {
            // Navigate to BudgetsTab to switch to the Budgets tab
            navigation.getParent()?.navigate('BudgetsTab');
          }}
          left={props => <List.Icon {...props} icon="chart-line-variant" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
        <List.Item
          title="Recurring Transactions"
          description="Set up automatic recurring income and expenses"
          onPress={() => navigation.navigate('RecurringTransactions')}
          left={props => <List.Icon {...props} icon="repeat" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
        <List.Item
          title="Affiliate Programme"
          description="Manage your affiliate accounts and links"
          onPress={() => navigation.navigate('AffiliateAccounts')}
          left={props => <List.Icon {...props} icon="link-variant" />}
          right={props => <List.Icon {...props} icon="chevron-right" />}
        />
        {ENABLE_PREMIUM_FEATURES && (
          <List.Item
            title="Premium"
            description={effectiveIsPremium ? "You're a premium member" : "Unlock all premium features"}
            onPress={() => navigation.navigate('Premium')}
            left={props => <List.Icon {...props} icon="crown" color={effectiveIsPremium ? "#FFD700" : undefined} />}
            right={props => <List.Icon {...props} icon="chevron-right" />}
          />
        )}

      <List.Item
          title="Backup data"
          description={isBackingUp ? 'Creating backup...' : 'Save a backup of your data to device storage or Google Drive'}
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
        <List.Item
          title="Restore data"
          description={isRestoring ? 'Restoring data...' : 'Restore your database from a previous backup'}
          onPress={handleRestorePress}
          left={props => <List.Icon {...props} icon="cloud-download" />}
          right={props =>
            isRestoring ? (
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

      {/* Backup Location Selection Modal */}
      <Portal>
        <Modal
          visible={backupLocationModalVisible}
          onDismiss={() => setBackupLocationModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Choose Backup Location
          </Text>
          <Text variant="bodyMedium" style={styles.modalDescription}>
            Where would you like to save your backup?
          </Text>
          
          <TouchableOpacity
            style={styles.backupOption}
            onPress={handleBackupToDevice}
            activeOpacity={0.7}
          >
            <View style={styles.backupOptionContent}>
              <List.Icon icon="folder" size={32} color={theme.colors.primary} />
              <View style={styles.backupOptionText}>
                <Text style={styles.backupOptionTitle}>Device Storage</Text>
                <Text style={styles.backupOptionDesc}>
                  Save backup to your device's storage
                </Text>
              </View>
            </View>
            <List.Icon icon="chevron-right" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backupOption}
            onPress={handleBackupToGoogleDrive}
            activeOpacity={0.7}
          >
            <View style={styles.backupOptionContent}>
              <List.Icon icon="cloud-upload" size={32} color={theme.colors.primary} />
              <View style={styles.backupOptionText}>
                <Text style={styles.backupOptionTitle}>Google Drive / Cloud</Text>
                <Text style={styles.backupOptionDesc}>
                  Share to Google Drive or other cloud storage
                </Text>
              </View>
            </View>
            <List.Icon icon="chevron-right" />
          </TouchableOpacity>

          <View style={styles.modalButtons}>
            <Button
              mode="text"
              onPress={() => setBackupLocationModalVisible(false)}
            >
              Cancel
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Restore Location Selection Modal */}
      <Portal>
        <Modal
          visible={restoreLocationModalVisible}
          onDismiss={() => setRestoreLocationModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Choose Restore Location
          </Text>
          <Text variant="bodyMedium" style={styles.modalDescription}>
            Where is your backup file located?
          </Text>
          
          <TouchableOpacity
            style={styles.backupOption}
            onPress={handleRestoreFromLocal}
            activeOpacity={0.7}
          >
            <View style={styles.backupOptionContent}>
              <List.Icon icon="folder" size={32} color={theme.colors.primary} />
              <View style={styles.backupOptionText}>
                <Text style={styles.backupOptionTitle}>Local Storage</Text>
                <Text style={styles.backupOptionDesc}>
                  Restore from backups saved on this device
                </Text>
              </View>
            </View>
            <List.Icon icon="chevron-right" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backupOption}
            onPress={handleRestoreFromFilePicker}
            activeOpacity={0.7}
          >
            <View style={styles.backupOptionContent}>
              <List.Icon icon="cloud-download" size={32} color={theme.colors.primary} />
              <View style={styles.backupOptionText}>
                <Text style={styles.backupOptionTitle}>Google Drive / Files</Text>
                <Text style={styles.backupOptionDesc}>
                  Select backup file from Google Drive or other locations
                </Text>
              </View>
            </View>
            <List.Icon icon="chevron-right" />
          </TouchableOpacity>

          <View style={styles.modalButtons}>
            <Button
              mode="text"
              onPress={() => setRestoreLocationModalVisible(false)}
            >
              Cancel
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Restore Data Modal - Local Backups List */}
      <Portal>
        <Modal
          visible={restoreModalVisible}
          onDismiss={() => setRestoreModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Text variant="titleLarge" style={styles.modalTitle}>
            Select Backup to Restore
          </Text>
          <Text variant="bodyMedium" style={styles.modalDescription}>
            Choose a backup file to restore your data from
          </Text>
          
          {isLoadingBackups ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading backups...</Text>
            </View>
          ) : availableBackups.length === 0 ? (
            <View style={styles.emptyBackupContainer}>
              <Text style={styles.emptyBackupText}>
                No backup files found. Please create a backup first.
              </Text>
            </View>
          ) : (
            <FlatList
              data={availableBackups}
              keyExtractor={(item) => item.path}
              style={styles.backupList}
              renderItem={({ item }) => {
                // Extract date from filename if possible
                const dateMatch = item.name.match(/(\d{4}-\d{2}-\d{2})/);
                const displayName = dateMatch 
                  ? `Backup from ${dateMatch[1]}`
                  : item.name.replace('dailydhan-backup-', '').replace('.db', '');
                
                return (
                  <TouchableOpacity
                    style={styles.backupItem}
                    onPress={() => handleRestoreFromBackup(item.path, item.name)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.backupItemContent}>
                      <List.Icon icon="database" size={24} color={theme.colors.primary} />
                      <View style={styles.backupItemText}>
                        <Text style={styles.backupItemName}>{displayName}</Text>
                        <Text style={styles.backupItemPath}>
                          {item.name} {item.location ? `(${item.location})` : ''}
                        </Text>
                      </View>
                    </View>
                    <List.Icon icon="chevron-right" />
                  </TouchableOpacity>
                );
              }}
            />
          )}

          <View style={styles.modalButtons}>
            <Button
              mode="text"
              onPress={() => setRestoreModalVisible(false)}
            >
              Cancel
            </Button>
          </View>
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
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
  backupTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backupTitleText: {
    flex: 1,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#856404',
    marginLeft: 4,
  },
  backupRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockIcon: {
    marginRight: 4,
  },
  lockedItem: {
    opacity: 0.7,
  },
  modalDescription: {
    marginBottom: 20,
    color: '#666',
  },
  backupOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  backupOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backupOptionText: {
    marginLeft: 16,
    flex: 1,
  },
  backupOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
  },
  backupOptionDesc: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  modalButtons: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyBackupContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyBackupText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  backupList: {
    maxHeight: 300,
  },
  backupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  backupItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backupItemText: {
    marginLeft: 12,
    flex: 1,
  },
  backupItemName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
    color: '#000',
  },
  backupItemPath: {
    fontSize: 12,
    color: '#666',
  },
});


