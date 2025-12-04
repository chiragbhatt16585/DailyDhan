# AdMob Configuration Summary

## ✅ Current Configuration

### Bundle ID / Package Name
- **Android Package**: `com.google.hrivya.dailydhan`
- **iOS Bundle ID**: `com.google.hrivya.dailydhan`

### AdMob App ID
- **Android App ID**: `ca-app-pub-8428345644446300~3982971442`
- **iOS App ID**: `ca-app-pub-8428345644446300~3982971442` (⚠️ Placeholder - see note below)

## 📁 Files Configured

### Android
1. ✅ `android/app/src/main/AndroidManifest.xml`
   - AdMob App ID: `ca-app-pub-8428345644446300~3982971442`
   - Package: `com.google.hrivya.dailydhan`

2. ✅ `android/app/build.gradle`
   - Application ID: `com.google.hrivya.dailydhan`
   - Google Services plugin applied

3. ✅ `android/build.gradle`
   - Google Services classpath added

4. ✅ `android/app/google-services.json`
   - Package name: `com.google.hrivya.dailydhan`
   - Firebase project configured

5. ✅ `app.json`
   - Android App ID configured

### iOS
1. ✅ `ios/DailyDhanFull/Info.plist`
   - Bundle ID: `com.google.hrivya.dailydhan`
   - AdMob App ID: `ca-app-pub-8428345644446300~3982971442` (⚠️ See note)

2. ✅ `ios/DailyDhanFull.xcodeproj/project.pbxproj`
   - PRODUCT_BUNDLE_IDENTIFIER: `com.google.hrivya.dailydhan`

## ⚠️ Important Notes

### iOS App ID
**You need to create a separate iOS app in AdMob to get an iOS-specific App ID.**

The current iOS App ID in `Info.plist` is using the Android App ID as a placeholder. To get your iOS App ID:

1. Go to [Google AdMob](https://admob.google.com/)
2. Click "Apps" → "Add App"
3. Select **iOS** platform
4. Enter your app details
5. Copy the iOS App ID (format: `ca-app-pub-xxxxxxxx~xxxxxxxx`)
6. Replace the value in `ios/DailyDhanFull/Info.plist`:
   ```xml
   <key>GADApplicationIdentifier</key>
   <string>YOUR_IOS_APP_ID_HERE</string>
   ```

### Ad Unit IDs
You still need to create **Ad Unit IDs** for displaying ads:

1. In AdMob dashboard, go to "Ad units"
2. Click "Add ad unit"
3. Choose ad format (Banner, Interstitial, etc.)
4. Copy the Ad Unit ID (format: `ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx`)
5. Update `src/components/AdBanner.js`:
   ```javascript
   const AD_UNIT_ID = __DEV__ 
     ? TestIds.BANNER
     : 'YOUR_AD_UNIT_ID_HERE';
   ```

## ✅ Verification Checklist

- [x] Android package name: `com.google.hrivya.dailydhan`
- [x] iOS bundle ID: `com.google.hrivya.dailydhan`
- [x] Android AdMob App ID configured
- [x] Google Services plugin configured
- [x] google-services.json file in place
- [ ] iOS AdMob App ID (needs to be created in AdMob)
- [ ] Ad Unit IDs created and configured

## 🚀 Next Steps

1. **Create iOS app in AdMob** and get iOS App ID
2. **Create Ad Units** in AdMob dashboard
3. **Update AdBanner.js** with your Ad Unit IDs
4. **Test the app** on both platforms

## 📝 Current Status

✅ **Android**: Fully configured and ready
⚠️ **iOS**: Needs iOS-specific App ID from AdMob

