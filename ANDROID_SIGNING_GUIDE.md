# Android App Signing Guide

## JKS File Created

A Java KeyStore (JKS) file has been created for signing your Android app for release builds.

### File Location
- **JKS File**: `android/app/dailydhan-release.jks`
- **Properties File**: `android/keystore.properties`

### Keystore Details

**⚠️ IMPORTANT: Keep these credentials secure and never commit them to version control!**

- **Keystore File**: `dailydhan-release.jks`
- **Key Alias**: `dailydhan-key`
- **Store Password**: `dailydhan123`
- **Key Password**: `dailydhan123`
- **Validity**: 10,000 days (~27 years)
- **Key Algorithm**: RSA 2048-bit

### Certificate Information
- **CN (Common Name)**: DailyDhan
- **OU (Organizational Unit)**: Development
- **O (Organization)**: DailyDhan
- **L (Locality)**: City
- **ST (State)**: State
- **C (Country)**: IN

## Build Configuration

The `android/app/build.gradle` file has been configured to:
- Use `debug.keystore` for debug builds
- Use `dailydhan-release.jks` for release builds
- Load credentials from `android/keystore.properties`

## Building a Release APK

To build a signed release APK:

```bash
cd android
./gradlew assembleRelease
```

The signed APK will be generated at:
`android/app/build/outputs/apk/release/app-release.apk`

## Building an AAB (Android App Bundle)

To build a signed AAB for Google Play Store:

```bash
cd android
./gradlew bundleRelease
```

The signed AAB will be generated at:
`android/app/build/outputs/bundle/release/app-release.aab`

## Security Notes

1. **Backup the JKS file**: Store a secure backup of `dailydhan-release.jks` in a safe location. If you lose this file, you won't be able to update your app on Google Play Store.

2. **Change Default Passwords**: Consider changing the default passwords (`dailydhan123`) to something more secure for production use.

3. **Never Commit**: The following files are in `.gitignore`:
   - `android/keystore.properties`
   - `android/app/*.jks`
   - `android/app/*.keystore`

4. **Team Sharing**: If working in a team, share the JKS file and credentials securely (not via version control).

## Changing Passwords

If you need to change the keystore password:

```bash
keytool -storepasswd -keystore android/app/dailydhan-release.jks
```

To change the key password:

```bash
keytool -keypasswd -alias dailydhan-key -keystore android/app/dailydhan-release.jks
```

## Verifying the Keystore

To verify the keystore and view certificate details:

```bash
keytool -list -v -keystore android/app/dailydhan-release.jks
```

## Troubleshooting

### Error: "Keystore file does not exist"
- Make sure `dailydhan-release.jks` exists in `android/app/` directory
- Check the path in `android/keystore.properties`

### Error: "Keystore was tampered with, or password was incorrect"
- Verify the password in `android/keystore.properties` matches the actual keystore password
- Check for any typos in the password

### Error: "Alias does not exist"
- Verify the `keyAlias` in `android/keystore.properties` matches the alias used when creating the keystore

## Next Steps

1. **Test the Release Build**: Build a release APK and test it on a device
2. **Update Passwords**: Consider changing to more secure passwords
3. **Backup**: Store a secure backup of the JKS file
4. **Google Play Console**: Upload the signed AAB to Google Play Console for publishing

