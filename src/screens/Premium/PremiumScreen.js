import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Card,
  Button,
  List,
  Divider,
  Icon,
  useTheme,
} from 'react-native-paper';
import { useAppStore } from '../../store/useAppStore';
import {
  getAvailableProducts,
  purchasePremium,
  restorePurchases,
  setupPurchaseListener,
  isIAPReady,
  PRODUCT_IDS,
} from '../../utils/premium';

const PremiumScreen = ({ navigation }) => {
  const theme = useTheme();
  const { isPremium, setPremium } = useAppStore();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    loadProduct();
    
    // Set up purchase listener
    const cleanup = setupPurchaseListener((purchased) => {
      if (purchased) {
        setPremium(true);
        Alert.alert(
          'Success!',
          'Welcome to DailyDhan Premium! All premium features are now unlocked.',
          [{ text: 'OK' }]
        );
      }
    });

    return cleanup;
  }, []);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const availableProducts = await getAvailableProducts();
      setProduct(availableProducts[0] || null);
    } catch (error) {
      console.warn('Failed to load product:', error);
      // Don't show error alert - getAvailableProducts returns mock data if IAP unavailable
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!product) return;
    
    try {
      setPurchasing(true);
      await purchasePremium(product.productId);
      // Purchase will be handled by the listener
    } catch (error) {
      if (error.message === 'Purchase cancelled by user') {
        // User cancelled, no need to show error
        return;
      }
      Alert.alert('Purchase Failed', error.message || 'Failed to complete purchase. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setLoading(true);
      const restored = await restorePurchases();
      if (restored) {
        setPremium(true);
        Alert.alert('Success', 'Your premium subscription has been restored!');
      } else {
        Alert.alert('No Purchases Found', 'We couldn\'t find any previous purchases to restore.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const premiumFeatures = [
    {
      icon: 'file-chart',
      title: 'Advanced Reports',
      description: 'Year-over-year comparisons, custom date ranges, PDF exports',
    },
    {
      icon: 'wallet',
      title: 'Budget Management',
      description: 'Set budgets per category, get alerts, track spending vs budget',
    },
    {
      icon: 'repeat',
      title: 'Recurring Transactions',
      description: 'Auto-create recurring income/expenses, never miss a bill',
    },
    {
      icon: 'cloud-upload',
      title: 'Data Backup',
      description: 'Save backups of your data to device storage, protect your financial records',
    },
    {
      icon: 'target',
      title: 'Savings Goals',
      description: 'Create multiple savings goals, track progress visually',
    },
    {
      icon: 'chart-line',
      title: 'Advanced Analytics',
      description: 'Spending forecasts, AI insights, category predictions',
    },
  ];

  if (isPremium) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Card style={styles.premiumCard}>
          <Card.Content>
            <View style={styles.premiumHeader}>
              <Icon source="crown" size={48} color="#FFD700" />
              <Text style={[styles.premiumTitle, { color: theme.colors.onSurface }]}>
                You're a Premium Member!
              </Text>
              <Text style={[styles.premiumSubtitle, { color: theme.colors.onSurfaceVariant }]}>
                Thank you for supporting DailyDhan. All premium features are unlocked.
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.featuresCard}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Premium Features
            </Text>
            {premiumFeatures.map((feature, index) => (
              <View key={index}>
                <List.Item
                  title={feature.title}
                  description={feature.description}
                  left={props => (
                    <List.Icon
                      {...props}
                      icon={feature.icon}
                      color={theme.colors.primary}
                    />
                  )}
                  right={props => (
                    <Icon source="check-circle" size={24} color="#4CAF50" />
                  )}
                />
                {index < premiumFeatures.length - 1 && <Divider />}
              </View>
            ))}
          </Card.Content>
        </Card>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerContent}>
            <Icon source="crown" size={64} color={theme.colors.primary} />
            <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
              Unlock Premium Features
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              Get the most out of DailyDhan with advanced features designed to help you manage your finances better.
            </Text>
          </View>
        </Card.Content>
      </Card>

      {!isIAPReady() && (
        <Card style={[styles.devNoticeCard, { backgroundColor: '#FFF3CD' }]}>
          <Card.Content>
            <View style={styles.devNoticeContent}>
              <Icon source="information" size={24} color="#856404" />
              <Text style={styles.devNoticeText}>
                <Text style={styles.devNoticeBold}>Development Mode:</Text> In-app purchases are not available in development or on emulators. To test purchases, use a real device with Google Play Services (Android) or App Store (iOS).
              </Text>
            </View>
          </Card.Content>
        </Card>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.onSurfaceVariant }]}>
            Loading product...
          </Text>
        </View>
      ) : (
        <>
          <Card style={styles.subscriptionCard}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Unlock Premium
              </Text>
              
              {product ? (
                <Card style={[styles.planCard, styles.recommendedCard]}>
                  <Card.Content>
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>ONE-TIME PURCHASE</Text>
                    </View>
                    <View style={styles.planHeader}>
                      <Text style={[styles.planTitle, { color: theme.colors.onSurface }]}>
                        DailyDhan Premium
                      </Text>
                      <Text style={[styles.planPrice, { color: theme.colors.primary }]}>
                        {product.localizedPrice || '₹299'}
                      </Text>
                      <Text style={[styles.planDescription, { color: theme.colors.onSurfaceVariant }]}>
                        One-time payment • Lifetime access • All premium features
                      </Text>
                    </View>
                    <Button
                      mode="contained"
                      onPress={handlePurchase}
                      loading={purchasing}
                      disabled={purchasing}
                      style={styles.purchaseButton}
                      icon="crown"
                    >
                      {purchasing ? 'Processing...' : 'Purchase Premium'}
                    </Button>
                  </Card.Content>
                </Card>
              ) : (
                <View style={styles.noProductContainer}>
                  <Text style={[styles.noProductText, { color: theme.colors.onSurfaceVariant }]}>
                    Product not available. Please check your internet connection or try again later.
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>

          <Card style={styles.featuresCard}>
            <Card.Content>
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
                Premium Features
              </Text>
              {premiumFeatures.map((feature, index) => (
                <View key={index}>
                  <List.Item
                    title={feature.title}
                    description={feature.description}
                    left={props => (
                      <List.Icon
                        {...props}
                        icon={feature.icon}
                        color={theme.colors.primary}
                      />
                    )}
                  />
                  {index < premiumFeatures.length - 1 && <Divider />}
                </View>
              ))}
            </Card.Content>
          </Card>

          <View style={styles.restoreContainer}>
            <Button
              mode="text"
              onPress={handleRestore}
              disabled={loading}
              icon="restore"
            >
              Restore Previous Purchases
            </Button>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  headerContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  premiumCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#E8F5E9',
  },
  premiumHeader: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  premiumSubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  subscriptionCard: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  planCard: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  recommendedCard: {
    borderColor: '#4CAF50',
    borderWidth: 2,
    position: 'relative',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  planHeader: {
    marginBottom: 16,
  },
  planTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  planSavings: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  planDescription: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  noProductContainer: {
    padding: 24,
    alignItems: 'center',
  },
  noProductText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  purchaseButton: {
    marginTop: 8,
  },
  featuresCard: {
    margin: 16,
    marginBottom: 8,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  restoreContainer: {
    padding: 16,
    alignItems: 'center',
  },
  devNoticeCard: {
    margin: 16,
    marginBottom: 8,
  },
  devNoticeContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  devNoticeText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
  devNoticeBold: {
    fontWeight: 'bold',
  },
});

export default PremiumScreen;

