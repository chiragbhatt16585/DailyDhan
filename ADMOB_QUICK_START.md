# AdMob Quick Start Guide

## ✅ What's Already Done

1. ✅ Package installed: `react-native-google-mobile-ads`
2. ✅ AdMob initialized in `App.js`
3. ✅ AdBanner component created at `src/components/AdBanner.js`
4. ✅ Test App IDs added to AndroidManifest.xml and Info.plist
5. ✅ Example ad placement added to Dashboard (commented out)

## 🚀 Next Steps

### Step 1: Get Your AdMob App IDs

1. Go to [Google AdMob](https://admob.google.com/)
2. Sign in (use same Google account as AdSense if you want)
3. Click **"Apps"** → **"Add App"**
4. Select:
   - **Platform**: Android and iOS
   - **App name**: DailyDhan
   - **App store**: Select your store or "No" if not published yet
5. Copy your **App IDs**:
   - Android: `ca-app-pub-xxxxxxxx~xxxxxxxx`
   - iOS: `ca-app-pub-xxxxxxxx~xxxxxxxx`

### Step 2: Create Ad Units

1. In AdMob dashboard, go to **"Ad units"**
2. Click **"Add ad unit"**
3. Choose **"Banner"** (or other formats)
4. Copy your **Ad Unit ID**: `ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx`

### Step 3: Update Configuration Files

#### Android (`android/app/src/main/AndroidManifest.xml`)
Replace the test App ID with your real one:
```xml
<meta-data
  android:name="com.google.android.gms.ads.APPLICATION_ID"
  android:value="ca-app-pub-YOUR-ANDROID-APP-ID~HERE"/>
```

#### iOS (`ios/DailyDhanFull/Info.plist`)
Replace the test App ID with your real one:
```xml
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-YOUR-IOS-APP-ID~HERE</string>
```

### Step 4: Update Ad Unit ID

Open `src/components/AdBanner.js` and replace:
```javascript
const AD_UNIT_ID = __DEV__ 
  ? TestIds.BANNER  // Keep this for testing
  : 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx'; // Your actual Ad Unit ID
```

### Step 5: Install iOS Pods

```bash
cd ios
pod install
cd ..
```

### Step 6: Enable Ads in Dashboard

1. Open `src/screens/Dashboard/DashboardScreen.js`
2. Uncomment the import:
   ```javascript
   import AdBanner from '../../components/AdBanner';
   ```
3. Uncomment the ad component:
   ```javascript
   <View style={styles.adContainer}>
     <AdBanner />
   </View>
   ```

### Step 7: Test Your App

```bash
# For Android
npm run android

# For iOS
npm run ios
```

## 📝 Important Notes

- **Test IDs**: The current setup uses Google's test IDs. This is safe for development.
- **Production**: Replace test IDs with your real Ad Unit IDs before publishing.
- **AdMob Policies**: Make sure your app complies with [AdMob policies](https://support.google.com/admob/answer/6128543)
- **User Experience**: Don't overdo ads - balance monetization with UX

## 🎯 Where to Place Ads

Good locations for banner ads:
- Bottom of Dashboard screen
- Between transaction lists
- At the end of scrollable content

Avoid:
- Blocking important UI elements
- Too many ads (users will uninstall)
- Interrupting critical user flows

## 🐛 Troubleshooting

- **Ads not showing**: Check console logs, verify App IDs are correct
- **Build errors**: Run `pod install` for iOS, sync Gradle for Android
- **Test ads**: Use `TestIds.BANNER` during development

## 📚 Additional Resources

- [AdMob Documentation](https://developers.google.com/admob)
- [react-native-google-mobile-ads Docs](https://github.com/invertase/react-native-google-mobile-ads)


