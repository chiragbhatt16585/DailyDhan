/**
 * Premium Features Management
 * 
 * This utility handles in-app purchases and premium status checking.
 * Uses react-native-iap for Google Play Billing and App Store purchases.
 */

import * as RNIap from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Product ID - Must match what you configure in Google Play Console and App Store Connect
export const PRODUCT_IDS = {
  PREMIUM_LIFETIME: 'premium_lifetime', // One-time purchase
};

const PREMIUM_STATUS_KEY = '@DailyDhan:premium_status';
const PURCHASE_TOKEN_KEY = '@DailyDhan:purchase_token';

let isIAPInitialized = false;
let isIAPAvailable = false;

/**
 * Initialize IAP connection
 */
export const initIAP = async () => {
  if (isIAPInitialized) {
    return isIAPAvailable;
  }
  
  try {
    await RNIap.initConnection();
    isIAPInitialized = true;
    isIAPAvailable = true;
    console.log('IAP initialized successfully');
    return true;
  } catch (error) {
    isIAPInitialized = true;
    isIAPAvailable = false;
    console.warn('Failed to initialize IAP:', error);
    // Don't throw error - IAP might not be available in development/emulator
    return false;
  }
};

/**
 * Check if IAP is available
 */
export const isIAPReady = () => {
  return isIAPInitialized && isIAPAvailable;
};

/**
 * Get available products (one-time purchase)
 */
export const getAvailableProducts = async () => {
  // Ensure IAP is initialized first
  if (!isIAPInitialized) {
    await initIAP();
  }
  
  if (!isIAPAvailable) {
    console.warn('IAP not available - likely in development mode or emulator');
    // Return mock data for development
    return [
      {
        productId: PRODUCT_IDS.PREMIUM_LIFETIME,
        title: 'DailyDhan Premium',
        description: 'Unlock all premium features - One-time purchase',
        localizedPrice: '₹299',
        currency: 'INR',
      },
    ];
  }
  
  try {
    const productIds = [PRODUCT_IDS.PREMIUM_LIFETIME];
    const products = await RNIap.getProducts(productIds);
    return products;
  } catch (error) {
    console.warn('Failed to get products:', error);
    // Return mock data based on error
    if (error.code === 'E_IAP_NOT_AVAILABLE') {
      // Return mock data for development
      return [
        {
          productId: PRODUCT_IDS.PREMIUM_LIFETIME,
          title: 'DailyDhan Premium',
          description: 'Unlock all premium features - One-time purchase',
          localizedPrice: '₹299',
          currency: 'INR',
        },
      ];
    }
    return [];
  }
};

/**
 * Purchase premium (one-time purchase)
 */
export const purchasePremium = async (productId) => {
  // Ensure IAP is initialized first
  if (!isIAPInitialized) {
    await initIAP();
  }
  
  if (!isIAPAvailable) {
    throw new Error('In-app purchases are not available. Please test on a real device with Google Play Services (Android) or App Store (iOS).');
  }
  
  try {
    const purchase = await RNIap.requestPurchase(productId);
    return purchase;
  } catch (error) {
    if (error.code === 'E_USER_CANCELLED') {
      throw new Error('Purchase cancelled by user');
    }
    if (error.code === 'E_IAP_NOT_AVAILABLE') {
      throw new Error('In-app purchases are not available. Please test on a real device.');
    }
    console.warn('Purchase failed:', error);
    throw error;
  }
};

/**
 * Restore previous purchases
 */
export const restorePurchases = async () => {
  // Ensure IAP is initialized first
  if (!isIAPInitialized) {
    await initIAP();
  }
  
  if (!isIAPAvailable) {
    throw new Error('In-app purchases are not available. Please test on a real device.');
  }
  
  try {
    const purchases = await RNIap.getAvailablePurchases();
    
    // Check if user has purchased premium (one-time purchase)
    const premiumPurchase = purchases.find(
      purchase => purchase.productId === PRODUCT_IDS.PREMIUM_LIFETIME
    );

    if (premiumPurchase) {
      await savePremiumStatus(true, premiumPurchase.transactionReceipt);
      return true;
    }
    
    return false;
  } catch (error) {
    if (error.code === 'E_IAP_NOT_AVAILABLE') {
      throw new Error('In-app purchases are not available. Please test on a real device.');
    }
    console.warn('Failed to restore purchases:', error);
    return false;
  }
};

/**
 * Check if user has active premium subscription
 */
export const checkPremiumStatus = async () => {
  try {
    // First check local storage
    const stored = await AsyncStorage.getItem(PREMIUM_STATUS_KEY);
    if (stored === 'true') {
      // Only verify with store if IAP is available
      if (isIAPAvailable) {
        try {
          const purchases = await RNIap.getAvailablePurchases();
          const hasActivePurchase = purchases.some(
            purchase => purchase.productId === PRODUCT_IDS.PREMIUM_LIFETIME
          );
          
          if (hasActivePurchase) {
            return true;
          } else {
            // Purchase expired, clear local status
            await clearPremiumStatus();
            return false;
          }
        } catch (error) {
          // If IAP check fails, trust local storage (for development)
          console.warn('Failed to verify purchase with store:', error);
          return true; // Trust local storage in development
        }
      } else {
        // IAP not available, trust local storage (for development)
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.warn('Failed to check premium status:', error);
    return false;
  }
};

/**
 * Save premium status locally
 */
const savePremiumStatus = async (isPremium, receipt) => {
  try {
    await AsyncStorage.setItem(PREMIUM_STATUS_KEY, isPremium ? 'true' : 'false');
    if (receipt) {
      await AsyncStorage.setItem(PURCHASE_TOKEN_KEY, receipt);
    }
  } catch (error) {
    console.warn('Failed to save premium status:', error);
  }
};

/**
 * Clear premium status
 */
const clearPremiumStatus = async () => {
  try {
    await AsyncStorage.removeItem(PREMIUM_STATUS_KEY);
    await AsyncStorage.removeItem(PURCHASE_TOKEN_KEY);
  } catch (error) {
    console.warn('Failed to clear premium status:', error);
  }
};

/**
 * Handle purchase updates (listener for purchase events)
 */
export const setupPurchaseListener = (onPurchaseUpdate) => {
  const purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(
    async (purchase) => {
      try {
        const { productId, transactionReceipt } = purchase;
        
        // Check if it's a premium purchase
        if (productId === PRODUCT_IDS.PREMIUM_LIFETIME) {
          await savePremiumStatus(true, transactionReceipt);
          onPurchaseUpdate(true);
        }
        
        // Acknowledge purchase
        if (purchase.transactionReceipt) {
          await RNIap.finishTransaction(purchase);
        }
      } catch (error) {
        console.warn('Failed to process purchase update:', error);
      }
    }
  );

  const purchaseErrorSubscription = RNIap.purchaseErrorListener(
    (error) => {
      console.warn('Purchase error:', error);
      onPurchaseUpdate(false);
    }
  );

  return () => {
    purchaseUpdateSubscription.remove();
    purchaseErrorSubscription.remove();
  };
};

/**
 * End IAP connection (cleanup)
 */
export const endIAPConnection = async () => {
  try {
    await RNIap.endConnection();
  } catch (error) {
    console.warn('Failed to end IAP connection:', error);
  }
};

