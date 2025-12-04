# Kotlin Version Compatibility Issue

## Problem
The app fails to build due to a Kotlin version mismatch:
- `react-native-google-mobile-ads` v16.0.0 requires Kotlin 2.1.0
- React Native 0.76 uses Kotlin 1.9.x internally
- The Kotlin compiler version shows as 1.9.0 but needs 2.1.0

## Error Message
```
Class 'kotlin.Unit' was compiled with an incompatible version of Kotlin. 
The actual metadata version is 2.1.0, but the compiler version 1.9.0 
can read versions up to 2.0.0.
```

## Solutions

### Option 1: Downgrade react-native-google-mobile-ads (Recommended)
Use a version compatible with Kotlin 1.9.x:

```bash
npm install react-native-google-mobile-ads@^15.0.0
cd android && ./gradlew clean
cd .. && npm run android
```

### Option 2: Wait for React Native Update
React Native 0.77+ may support Kotlin 2.1.0

### Option 3: Use React Native 0.75 or earlier
If you need Kotlin 2.1.0 support now

## Current Configuration
- React Native: 0.76.0
- react-native-google-mobile-ads: 16.0.0
- Kotlin Version Set: 2.1.0
- Kotlin Compiler Used: 1.9.0 (from React Native)

## Status
⚠️ **Build currently failing** - Need to resolve Kotlin version conflict

