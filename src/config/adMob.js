// AdMob Configuration
// IMPORTANT: Replace with your actual Ad Unit IDs from AdMob dashboard

export const ADMOB_CONFIG = {
  // Banner Ad Unit ID - REQUIRED
  // How to get: AdMob Dashboard > Apps > Your App > Ad units > Create Ad unit > Banner
  // Format: ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx
  // NOTE: This is DIFFERENT from App ID (App ID has ~, Ad Unit ID has /)
  BANNER_AD_UNIT_ID: 'ca-app-pub-8428345644446300/5413255571', // Live Banner Ad Unit ID
  
  // Interstitial Ad Unit ID (optional - for future use)
  INTERSTITIAL_AD_UNIT_ID: '', // Add your Interstitial Ad Unit ID here if needed
  
  // Rewarded Ad Unit ID (optional - for future use)
  REWARDED_AD_UNIT_ID: '', // Add your Rewarded Ad Unit ID here if needed
  
  // Logging Configuration
  // Set to true to see detailed AdMob error logs (useful for debugging)
  // Set to false to reduce console noise (recommended for production)
  VERBOSE_LOGGING: false, // Set to true if you want to see all AdMob errors in console
};

// Use test ads in development, live ads in production
export const getBannerAdUnitId = () => {
  // FORCE_LIVE_ADS: Set to true to test live ads even in development
  // Set to false to use test ads in development (recommended)
  // 
  // IMPORTANT: 
  // - Set FORCE_LIVE_ADS = true to test your live Ad Unit ID
  // - Set FORCE_LIVE_ADS = false to use test ads (always work)
  // - In production builds, live ads are always used
  const FORCE_LIVE_ADS = true; // Change to true to test live ads
  
  // Use test ads in development unless forced to use live ads
  if (__DEV__ && !FORCE_LIVE_ADS) {
    console.log('AdMob: Using TEST Ad Unit ID');
    return 'ca-app-pub-3940256099942544/6300978111'; // Google Test Ad Unit ID (always works)
  }
  
  // Return live Ad Unit ID
  console.log('AdMob: Using LIVE Ad Unit ID:', ADMOB_CONFIG.BANNER_AD_UNIT_ID);
  return ADMOB_CONFIG.BANNER_AD_UNIT_ID;
};

