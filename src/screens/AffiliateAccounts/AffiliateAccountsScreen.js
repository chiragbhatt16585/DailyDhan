import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Linking, ScrollView, Image } from 'react-native';
import {
  List,
  Text,
  Button,
  Card,
  Icon,
} from 'react-native-paper';
import { AppHeader } from '../../components/AppHeader';
import { getPlatformById, formatAffiliateLink } from '../../utils/affiliatePlatforms';
import { AFFILIATE_ACCOUNTS } from '../../config/affiliateAccounts';

const AffiliateAccountsScreen = ({ navigation }) => {
  // Handle open affiliate link
  const handleOpenAffiliateLink = (account) => {
    const platform = getPlatformById(account.platformId);
    const link = formatAffiliateLink(platform, account.affiliateId);
    if (link) {
      Linking.openURL(link).catch(err =>
        console.warn('Failed to open affiliate link:', err)
      );
    }
  };

  // Handle open platform website
  const handleOpenWebsite = (platform) => {
    if (platform.website) {
      Linking.openURL(platform.website).catch(err =>
        console.warn('Failed to open URL:', err)
      );
    }
  };

  const renderAccountItem = ({ item }) => {
    const platform = getPlatformById(item.platformId);
    const isAmazon = platform.id === 'amazon' || platform.id === 'amazon_in';
    
    return (
      <Card style={styles.accountCard}>
        <Card.Content>
          <View style={styles.accountHeader}>
            <View style={styles.accountInfo}>
              <View style={[styles.platformIcon, { backgroundColor: isAmazon ? '#F5F5F5' : platform.color + '20' }]}>
                {isAmazon ? (
                  <Image 
                    source={require('../../assets/amazon-logo.webp')} 
                    style={styles.amazonLogo}
                    resizeMode="contain"
                  />
                ) : (
                  <List.Icon icon={platform.icon} color={platform.color} size={24} />
                )}
              </View>
              <View style={styles.accountDetails}>
                <Text style={styles.accountName}>{item.name}</Text>
                <Text style={styles.accountPlatform}>{platform.description}</Text>
              </View>
            </View>
          </View>
          <View style={styles.accountActions}>
            <Button
              mode="outlined"
              icon="open-in-new"
              onPress={() => handleOpenAffiliateLink(item)}
              style={styles.actionButton}
              compact
            >
              Open Link
            </Button>
            {platform.website && (
              <Button
                mode="text"
                icon="web"
                onPress={() => handleOpenWebsite(platform)}
                style={styles.actionButton}
                compact
              >
                Website
              </Button>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <>
      <AppHeader showBack title="Affiliate Programme" />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Information Card */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.infoHeader}>
              <Icon source="information" size={24} color="#1A73E8" />
              <Text variant="titleMedium" style={styles.infoTitle}>
                Why Affiliate Links?
              </Text>
            </View>
            <View style={styles.infoContent}>
              <View style={styles.infoItem}>
                <Icon source="check-circle" size={20} color="#34A853" />
                <Text style={styles.infoText}>
                  <Text style={styles.infoBold}>DailyDhan is completely FREE</Text> - No charges, no subscriptions, no hidden fees
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Icon source="check-circle" size={20} color="#34A853" />
                <Text style={styles.infoText}>
                  When you purchase through our affiliate links, we earn a <Text style={styles.infoBold}>small commission</Text> at no extra cost to you
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Icon source="check-circle" size={20} color="#34A853" />
                <Text style={styles.infoText}>
                  You pay the <Text style={styles.infoBold}>same price</Text> - the commission comes from the merchant, not from you
                </Text>
              </View>
              <View style={styles.infoItem}>
                <Icon source="check-circle" size={20} color="#34A853" />
                <Text style={styles.infoText}>
                  Your support helps us <Text style={styles.infoBold}>keep the app free</Text> and continue improving it
                </Text>
              </View>
              <View style={styles.infoFooter}>
                <Text style={styles.infoFooterText}>
                  💡 <Text style={styles.infoBold}>Tip:</Text> Using our affiliate links is a win-win - you get great deals, and you help support free apps like DailyDhan!
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {AFFILIATE_ACCOUNTS.length === 0 ? (
          <View style={styles.emptyContainer}>
            <List.Icon icon="link-variant" size={64} color="#9E9E9E" />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              No Affiliate Accounts Configured
            </Text>
            <Text style={styles.emptyText}>
              Configure your affiliate accounts in{'\n'}
              <Text style={styles.codeText}>src/config/affiliateAccounts.js</Text>
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text variant="titleMedium" style={styles.headerTitle}>
                Available Affiliate Links ({AFFILIATE_ACCOUNTS.length})
              </Text>
            </View>
            <View style={styles.listContent}>
              {AFFILIATE_ACCOUNTS.map((item, index) => (
                <View key={`${item.platformId}-${index}`}>
                  {renderAccountItem({ item })}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
};

export default AffiliateAccountsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  infoCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#1A73E8',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    marginLeft: 8,
    fontWeight: '600',
    color: '#1A73E8',
  },
  infoContent: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  infoBold: {
    fontWeight: '600',
    color: '#1A73E8',
  },
  infoFooter: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  infoFooterText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#555',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  accountCard: {
    marginBottom: 12,
    elevation: 2,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  platformIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  amazonLogo: {
    width: 40,
    height: 40,
  },
  accountDetails: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  accountPlatform: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  accountId: {
    fontSize: 11,
    color: '#999',
    fontFamily: 'monospace',
  },
  accountActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  codeText: {
    fontFamily: 'monospace',
    backgroundColor: '#F5F5F5',
    padding: 4,
    borderRadius: 4,
    fontSize: 12,
  },
});

