# Premium Status Management - How It Works

## Overview

This document explains how the app checks and manages whether a customer has purchased the premium package.

## Current Flow

### 1. **Purchase Process**

```
User clicks "Purchase Premium"
    ↓
react-native-iap requests purchase from Google Play/App Store
    ↓
User completes payment
    ↓
Purchase receipt received
    ↓
Purchase listener triggered
    ↓
Premium status saved to AsyncStorage
    ↓
App state updated (isPremium = true)
```

### 2. **Premium Status Checking**

The app checks premium status in multiple ways:

#### A. **On App Start** (Automatic)
- When app launches, `initializePremium()` is called
- Checks local storage first (fast)
- Verifies with store if IAP is available
- Updates app state

#### B. **After Purchase** (Immediate)
- Purchase listener detects successful purchase
- Immediately updates premium status
- User gets instant access

#### C. **Throughout App** (Real-time)
- Uses `useAppStore()` hook to check `isPremium` state
- All screens check this state before showing premium features

### 3. **Storage Locations**

Premium status is stored in **two places**:

1. **AsyncStorage** (Local device storage)
   - Key: `@DailyDhan:premium_status`
   - Value: `"true"` or `"false"`
   - Purpose: Fast access, works offline

2. **Google Play / App Store** (Platform verification)
   - Purchase receipts stored by platform
   - Purpose: Verify purchase is valid
   - Checked when app starts (if IAP available)

## Code Flow

### Step 1: App Initialization

```javascript
// App.js
useEffect(() => {
  initializePremium(); // Checks premium status on app start
}, []);
```

### Step 2: Premium Status Check

```javascript
// src/store/useAppStore.js
initializePremium: async () => {
  await initIAP(); // Connect to Google Play/App Store
  const isPremium = await checkPremiumStatus(); // Check if user has premium
  set({ isPremium }); // Update app state
}
```

### Step 3: Check Premium Status Function

```javascript
// src/utils/premium.js
checkPremiumStatus: async () => {
  // 1. Check local storage first
  const stored = await AsyncStorage.getItem('@DailyDhan:premium_status');
  
  if (stored === 'true') {
    // 2. Verify with store (if available)
    if (isIAPAvailable) {
      const purchases = await RNIap.getAvailablePurchases();
      const hasActivePurchase = purchases.some(
        purchase => purchase.productId === 'premium_lifetime'
      );
      
      if (hasActivePurchase) {
        return true; // Premium confirmed
      } else {
        // Purchase expired/refunded, clear local status
        await clearPremiumStatus();
        return false;
      }
    } else {
      // IAP not available (dev mode), trust local storage
      return true;
    }
  }
  
  return false; // Not premium
}
```

### Step 4: Purchase Listener

```javascript
// When user purchases
setupPurchaseListener((purchased) => {
  if (purchased) {
    // Save to local storage
    await savePremiumStatus(true, receipt);
    // Update app state
    setPremium(true);
  }
});
```

### Step 5: Using Premium Status in App

```javascript
// Any screen/component
import { useAppStore } from '../store/useAppStore';

const MyScreen = () => {
  const { isPremium } = useAppStore();
  
  if (!isPremium) {
    // Show upgrade prompt
    return <UpgradePrompt />;
  }
  
  // Show premium feature
  return <PremiumFeature />;
};
```

## How Premium Status is Verified

### Method 1: Local Storage Check (Fast)
- Checks `AsyncStorage` for `@DailyDhan:premium_status`
- Returns immediately
- Works offline

### Method 2: Store Verification (Secure)
- Queries Google Play/App Store for active purchases
- Verifies purchase receipt is valid
- More secure but requires internet

### Method 3: Restore Purchases
- User can manually restore purchases
- Useful when switching devices
- Checks store for all previous purchases

## Current Implementation Details

### Files Involved:

1. **`src/utils/premium.js`**
   - `checkPremiumStatus()` - Main checking function
   - `savePremiumStatus()` - Save to local storage
   - `restorePurchases()` - Restore from store
   - `setupPurchaseListener()` - Listen for purchases

2. **`src/store/useAppStore.js`**
   - `isPremium` - Global premium state
   - `setPremium()` - Update premium state
   - `initializePremium()` - Check on app start

3. **`App.js`**
   - Calls `initializePremium()` on app launch

### Premium Status States:

- **`isPremium: true`** - User has premium, all features unlocked
- **`isPremium: false`** - User doesn't have premium, features locked

## How to Check Premium Status

### In Any Component:

```javascript
import { useAppStore } from '../store/useAppStore';

const MyComponent = () => {
  const { isPremium } = useAppStore();
  
  // Use isPremium to gate features
  return isPremium ? <PremiumContent /> : <FreeContent />;
};
```

### In Settings Screen:

```javascript
const SettingsScreen = () => {
  const { isPremium } = useAppStore();
  
  const handleBackup = () => {
    if (!isPremium) {
      Alert.alert('Premium Feature', 'Upgrade to unlock');
      return;
    }
    // Proceed with backup
  };
};
```

### In Reports Screen:

```javascript
const ReportsScreen = () => {
  const { isPremium } = useAppStore();
  
  const handleReportPress = (report) => {
    if (report.isPremium && !isPremium) {
      Alert.alert('Premium Feature', 'Upgrade required');
      return;
    }
    navigation.navigate(report.screen);
  };
};
```

## Potential Issues & Solutions

### Issue 1: Premium Status Not Persisting

**Problem:** User purchases but premium doesn't activate

**Solution:**
- Check purchase listener is set up
- Verify `savePremiumStatus()` is called
- Check AsyncStorage permissions

### Issue 2: Premium Lost After App Restart

**Problem:** Premium works but disappears after restart

**Solution:**
- Ensure `initializePremium()` is called in App.js
- Check `checkPremiumStatus()` is working
- Verify store connection

### Issue 3: Premium Not Syncing Across Devices

**Problem:** Premium works on one device but not another

**Solution:**
- Use "Restore Purchases" feature
- Or implement backend sync (see CROSS_PLATFORM_PREMIUM_GUIDE.md)

### Issue 4: Development/Testing

**Problem:** Can't test premium in development

**Solution:**
- Use sandbox/test accounts
- Mock premium status for testing
- Use `setPremium(true)` for testing

## Testing Premium Status

### Test as Premium User:

```javascript
// In development, you can manually set premium
import { useAppStore } from '../store/useAppStore';

const { setPremium } = useAppStore();
setPremium(true); // Enable premium for testing
```

### Test Purchase Flow:

1. Use sandbox/test account
2. Make test purchase
3. Verify purchase listener fires
4. Check `isPremium` becomes `true`
5. Restart app and verify status persists

## Debugging Premium Status

### Check Current Status:

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Check local storage
const status = await AsyncStorage.getItem('@DailyDhan:premium_status');
console.log('Premium status:', status);

// Check app state
const { isPremium } = useAppStore();
console.log('App state isPremium:', isPremium);
```

### Clear Premium Status (for testing):

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.removeItem('@DailyDhan:premium_status');
// Restart app to reset state
```

## Summary

**How Premium Status is Managed:**

1. ✅ **Purchase** → Saved to AsyncStorage + App state
2. ✅ **App Start** → Checked from AsyncStorage + Verified with store
3. ✅ **Throughout App** → Accessed via `useAppStore().isPremium`
4. ✅ **Restore** → User can restore purchases manually

**The system works automatically:**
- Checks on app start
- Updates after purchase
- Persists across app restarts
- Verifies with store when possible

**To use premium status:**
- Import `useAppStore`
- Get `isPremium` from store
- Gate features based on status

The current implementation handles premium status checking automatically and reliably!

