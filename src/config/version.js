// App version configuration
// This reads from package.json which is the source of truth for React Native apps
// The version in package.json should match the versionName in android/app/build.gradle
// and CFBundleShortVersionString in ios/DailyDhanFull/Info.plist

import { version } from '../../package.json';

export const APP_VERSION = version;

// Export version info
export default {
  version: APP_VERSION,
};

