# Google AdMob Setup Guide for DailyDhan

## Important Note
You mentioned you created a Google AdSense account, but for mobile apps you need **Google AdMob** (not AdSense). AdSense is for websites. However, if you use the same Google account, your AdMob account will be linked.

## Step 1: Create AdMob Account & Get App IDs

1. Go to [Google AdMob](https://admob.google.com/)
2. Sign in with your Google account (same as AdSense if you want)
3. Click "Add App" and select:
   - Platform: Android and iOS
   - App name: DailyDhan
   - App store: Google Play Store / Apple App Store (or select "No" if not published yet)

4. After creating the app, you'll get:
   - **Android App ID**: `ca-app-pub-xxxxxxxx~xxxxxxxx`
   - **iOS App ID**: `ca-app-pub-xxxxxxxx~xxxxxxxx`

5. Create Ad Units:
   - Go to "Ad units" in AdMob dashboard
   - Click "Add ad unit"
   - Choose ad format (Banner, Interstitial, Rewarded, etc.)
   - Copy the **Ad Unit ID**: `ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx`

## Step 2: Configure Android

### Update AndroidManifest.xml

1. Open `android/app/src/main/AndroidManifest.xml`
2. Add your Android App ID in the `<application>` tag:

```xml
<manifest>
  <application>
    <!-- Add this meta-data tag inside <application> -->
    <meta-data
      android:name="com.google.android.gms.ads.APPLICATION_ID"
      android:value="ca-app-pub-xxxxxxxx~xxxxxxxx"/>
    
    <!-- Your existing application content -->
  </application>
</manifest>
```

### Update build.gradle

1. Open `android/build.gradle`
2. Make sure you have the Google services classpath (usually already there for React Native)

## Step 3: Configure iOS

### Update Info.plist

1. Open `ios/DailyDhanFull/Info.plist`
2. Add your iOS App ID:

```xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-xxxxxxxx~xxxxxxxx</string>
```

### Install Pods

```bash
cd ios
pod install
cd ..
```

## Step 4: Initialize AdMob in Your App

1. Open your main entry file (`App.js` or `App.tsx`)
2. Add AdMob initialization:

```javascript
import { MobileAds } from 'react-native-google-mobile-ads';

// Initialize AdMob
MobileAds()
  .initialize()
  .then(adapterStatuses => {
    console.log('AdMob initialized', adapterStatuses);
  });
```

## Step 5: Update Ad Unit IDs

1. Open `src/components/AdBanner.js`
2. Replace the placeholder `AD_UNIT_ID` with your actual Ad Unit ID from AdMob dashboard

## Step 6: Use Ads in Your App

You can now use the AdBanner component anywhere in your app:

```javascript
import AdBanner from './components/AdBanner';

// In your component
<AdBanner />
```

## Test IDs (For Development)

During development, you can use these test IDs:
- **Banner**: `TestIds.BANNER` (already set in AdBanner.js for dev mode)
- **Interstitial**: `TestIds.INTERSTITIAL`
- **Rewarded**: `TestIds.REWARDED`

## Important Notes

1. **Don't use test IDs in production** - Always replace with your actual Ad Unit IDs
2. **AdMob Policy**: Make sure your app complies with AdMob policies
3. **User Experience**: Don't overdo ads - balance monetization with user experience
4. **Testing**: Test ads on real devices, not just simulators

## Common Ad Sizes

- `BannerAdSize.BANNER` - 320x50 (default)
- `BannerAdSize.LARGE_BANNER` - 320x100
- `BannerAdSize.MEDIUM_RECTANGLE` - 300x250
- `BannerAdSize.FULL_BANNER` - 468x60
- `BannerAdSize.LEADERBOARD` - 728x90

## Next Steps

1. Complete AdMob account setup
2. Get your App IDs and Ad Unit IDs
3. Update the configuration files
4. Replace test IDs with real IDs
5. Test on real devices
6. Submit your app for review (if needed)

## Troubleshooting

- **Ads not showing**: Check console logs, verify App IDs are correct
- **Build errors**: Make sure pods are installed for iOS, gradle sync for Android
- **Test ads**: Use TestIds during development to avoid policy violations

