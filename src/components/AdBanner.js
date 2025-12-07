import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { getBannerAdUnitId, ADMOB_CONFIG } from '../config/adMob';

// Get the Ad Unit ID (live ads in production, configurable test ads in development)
const AD_UNIT_ID = getBannerAdUnitId();

const AdBanner = ({ size = BannerAdSize.BANNER, style }) => {
  const [adError, setAdError] = useState(null);
  const [adLoaded, setAdLoaded] = useState(false);

  const handleAdFailedToLoad = (error) => {
    const errorCode = error?.code || error?.message || '';
    const errorMessage = error?.message || JSON.stringify(error);
    const verboseLogging = ADMOB_CONFIG.VERBOSE_LOGGING || false;
    
    // Handle different error types
    if (errorCode.includes('no-fill') || errorCode.includes('ERROR_CODE_NO_FILL')) {
      // No-fill is expected - AdMob doesn't always have ads available
      // This is normal, especially for new ad units or in development
      setAdError('no-fill');
      
      // Only log no-fill errors if verbose logging is enabled
      if (verboseLogging) {
        console.log('AdMob: No ad inventory available (this is normal for new ad units)');
        console.log('Ad Unit ID:', AD_UNIT_ID);
      }
    } else if (errorCode.includes('network') || errorCode.includes('ERROR_CODE_NETWORK_ERROR')) {
      setAdError('network');
      if (verboseLogging || __DEV__) {
        console.warn('AdMob: Network error - check internet connection');
      }
    } else if (errorCode.includes('invalid') || errorCode.includes('ERROR_CODE_INVALID_REQUEST')) {
      setAdError('invalid');
      // Always log invalid ad unit errors (these are important)
      console.error('AdMob: Invalid Ad Unit ID - check your configuration');
      console.error('Current Ad Unit ID:', AD_UNIT_ID);
      if (verboseLogging) {
        console.error('Error details:', error);
      }
    } else {
      setAdError('other');
      // Log unexpected errors
      if (verboseLogging || __DEV__) {
        console.warn('AdMob error:', {
          code: errorCode,
          message: errorMessage,
          adUnitId: AD_UNIT_ID,
        });
      }
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


