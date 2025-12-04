import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { getBannerAdUnitId } from '../config/adMob';

// Get the Ad Unit ID (live ads in production, configurable test ads in development)
const AD_UNIT_ID = getBannerAdUnitId();

const AdBanner = ({ size = BannerAdSize.BANNER, style }) => {
  const [adError, setAdError] = useState(null);
  const [adLoaded, setAdLoaded] = useState(false);

  const handleAdFailedToLoad = (error) => {
    const errorCode = error?.code || error?.message || '';
    const errorMessage = error?.message || JSON.stringify(error);
    
    // Log full error details for debugging
    console.warn('AdMob Error Details:', {
      code: errorCode,
      message: errorMessage,
      fullError: error,
      adUnitId: AD_UNIT_ID,
    });
    
    // Handle different error types
    if (errorCode.includes('no-fill') || errorCode.includes('ERROR_CODE_NO_FILL')) {
      // No-fill is expected - AdMob doesn't always have ads available
      setAdError('no-fill');
      console.warn('AdMob: No ad inventory available');
      console.warn('Possible reasons:');
      console.warn('1. Ad Unit is new (may take 24-48 hours to activate)');
      console.warn('2. AdMob account needs verification/payment setup');
      console.warn('3. Limited ad inventory for your location');
      console.warn('4. App not published or Ad Unit not approved');
    } else if (errorCode.includes('network') || errorCode.includes('ERROR_CODE_NETWORK_ERROR')) {
      setAdError('network');
      console.warn('AdMob: Network error - check internet connection');
    } else if (errorCode.includes('invalid') || errorCode.includes('ERROR_CODE_INVALID_REQUEST')) {
      setAdError('invalid');
      console.error('AdMob: Invalid Ad Unit ID - check your configuration');
      console.error('Current Ad Unit ID:', AD_UNIT_ID);
    } else {
      setAdError('other');
      console.error('AdMob error:', error);
    }
  };

  const handleAdLoaded = () => {
    setAdLoaded(true);
    setAdError(null);
    if (__DEV__) {
      console.log('AdMob: Ad loaded successfully');
    }
  };

  // Don't render anything if ad failed with no-fill (to avoid empty space)
  // You can uncomment the return below if you want to show a placeholder
  if (adError === 'no-fill' && !adLoaded) {
    return null; // Hide ad container when no ad is available
  }

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        unitId={AD_UNIT_ID}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={handleAdLoaded}
        onAdFailedToLoad={handleAdFailedToLoad}
      />
    </View>
  );
};

export default AdBanner;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});


