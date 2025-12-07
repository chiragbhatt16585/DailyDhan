# Premium Feature Flag Guide

## Overview

The app now uses a feature flag to control whether premium features are enabled or disabled. When disabled, all features are free and accessible to all users.

## Configuration

The feature flag is located in: `src/config/premium.js`

```javascript
export const ENABLE_PREMIUM_FEATURES = false; // Set to true to enable premium features
```

## How to Enable/Disable Premium Features

### To Disable Premium (Make All Features Free):
1. Open `src/config/premium.js`
2. Set `ENABLE_PREMIUM_FEATURES = false`
3. All premium features will be accessible to all users
4. Premium purchase screen will still be accessible but won't enforce purchases

### To Enable Premium (Require Payment):
1. Open `src/config/premium.js`
2. Set `ENABLE_PREMIUM_FEATURES = true`
3. Premium features will be gated and require purchase
4. Users will see upgrade prompts for premium features

## What Changes When the Flag is Disabled?

When `ENABLE_PREMIUM_FEATURES = false`:

- ✅ All premium reports are accessible
- ✅ Backup and restore features are accessible
- ✅ All premium features work without payment
- ✅ Premium status checks always return `true`
- ✅ `PremiumGate` component always shows children
- ✅ Premium menu item in Settings is hidden
- ✅ No upgrade prompts are shown

## Files Updated

The following files respect the feature flag:

1. **`src/config/premium.js`** - Feature flag configuration
2. **`src/components/PremiumGate.js`** - Always shows children when disabled
3. **`src/store/useAppStore.js`** - Always sets premium to true when disabled
4. **`src/screens/Reports/ReportsListScreen.js`** - All reports accessible when disabled
5. **`src/screens/Settings/SettingsScreen.js`** - Hides premium menu item when disabled

## Testing

1. **With Premium Disabled (`ENABLE_PREMIUM_FEATURES = false`)**:
   - All reports should be accessible
   - Backup/restore should work without prompts
   - No premium upgrade prompts should appear

2. **With Premium Enabled (`ENABLE_PREMIUM_FEATURES = true`)**:
   - Premium reports should show upgrade prompts
   - Backup/restore should check premium status
   - Premium menu item should appear in Settings

## Notes

- The Premium screen is still accessible even when the flag is disabled
- IAP initialization still runs but won't enforce purchases when disabled
- You can toggle the flag at any time without code changes elsewhere

