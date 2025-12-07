import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import DocumentPicker from 'react-native-document-picker';

const DB_NAME = 'dailydhan.db';
const ANDROID_PACKAGE_NAME = 'com.dailydhan';

const getDatabasePath = () => {
  if (Platform.OS === 'ios') {
    // react-native-sqlite-storage default iOS location for "default" is Library/LocalDatabase
    return `${RNFS.LibraryDirectoryPath}/LocalDatabase/${DB_NAME}`;
  }

  // Android default location for SQLite databases
  return `/data/data/${ANDROID_PACKAGE_NAME}/databases/${DB_NAME}`;
};

const getBackupDirectory = async () => {
  let baseDir;

  if (Platform.OS === 'android') {
    // Use Downloads directory for easier access (no permission needed on Android 10+)
    // Falls back to external directory if Downloads not available
    try {
      const downloadsPath = `${RNFS.DownloadDirectoryPath}/DailyDhanBackups`;
      const downloadsExists = await RNFS.exists(RNFS.DownloadDirectoryPath);
      if (downloadsExists) {
        baseDir = RNFS.DownloadDirectoryPath;
      } else {
        // Fallback to external directory
        baseDir = RNFS.ExternalDirectoryPath || RNFS.DocumentDirectoryPath;
      }
    } catch (error) {
      // Fallback to external directory
    baseDir = RNFS.ExternalDirectoryPath || RNFS.DocumentDirectoryPath;
    }
  } else {
    // iOS: app's Documents directory
    baseDir = RNFS.DocumentDirectoryPath;
  }

  const backupDir = `${baseDir}/DailyDhanBackups`;

  const exists = await RNFS.exists(backupDir);
  if (!exists) {
    await RNFS.mkdir(backupDir);
  }

  // Create a .nomedia file to prevent media scanning (optional, but helps with file manager visibility)
  // Note: Some file managers might hide folders with .nomedia, so we'll skip this
  // const nomediaPath = `${backupDir}/.nomedia`;
  // if (!(await RNFS.exists(nomediaPath))) {
  //   await RNFS.writeFile(nomediaPath, '', 'utf8');
  // }

  return backupDir;
};

export const createDatabaseBackup = async () => {
  const dbPath = getDatabasePath();
  const dbExists = await RNFS.exists(dbPath);

  if (!dbExists) {
    throw new Error('Database file not found. Open the app and add some data first.');
  }

  const backupDir = await getBackupDirectory();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `dailydhan-backup-${timestamp}.db`;
  const backupPath = `${backupDir}/${backupFileName}`;

  await RNFS.copyFile(dbPath, backupPath);

  return backupPath;
};

/**
 * Share backup file to Google Drive or other locations
 */
export const shareBackupToDrive = async (backupPath) => {
  try {
    const shareOptions = {
      title: 'DailyDhan Backup',
      message: 'DailyDhan database backup file',
      url: Platform.OS === 'android' ? `file://${backupPath}` : backupPath,
      type: 'application/x-sqlite3',
      filename: backupPath.split('/').pop(),
      saveToFiles: true,
    };

    await Share.open(shareOptions);
    return true;
  } catch (error) {
    // User cancelled sharing
    if (error.message === 'User did not share' || error.message?.includes('cancelled')) {
      return false;
    }
    throw new Error(`Failed to share backup: ${error.message}`);
  }
};

/**
 * Upload backup to Google Drive (requires Google Sign-In)
 * This is a placeholder - full implementation requires Google Drive API setup
 */
export const uploadBackupToGoogleDrive = async (backupPath) => {
  // For now, use share functionality which allows user to save to Google Drive
  // Full Google Drive API integration requires:
  // 1. Google Sign-In setup
  // 2. Google Drive API credentials
  // 3. OAuth token management
  return await shareBackupToDrive(backupPath);
};

/**
 * Get list of available backup files from all possible locations
 */
export const getAvailableBackups = async () => {
  try {
    const allBackups = [];
    
    // Check primary location (Downloads folder)
    try {
      const primaryBackupDir = await getBackupDirectory();
      if (await RNFS.exists(primaryBackupDir)) {
        const files = await RNFS.readdir(primaryBackupDir);
        const backupFiles = files
          .filter(file => file.endsWith('.db'))
          .map(file => ({
            name: file,
            path: `${primaryBackupDir}/${file}`,
            location: 'Downloads',
          }));
        allBackups.push(...backupFiles);
      }
    } catch (error) {
      console.warn('Failed to read primary backup directory:', error);
    }
    
    // Check old location (Android/data folder) for backward compatibility
    if (Platform.OS === 'android') {
      try {
        const oldBackupDir = `${RNFS.ExternalDirectoryPath || RNFS.DocumentDirectoryPath}/DailyDhanBackups`;
        if (await RNFS.exists(oldBackupDir)) {
          const files = await RNFS.readdir(oldBackupDir);
          const backupFiles = files
            .filter(file => file.endsWith('.db'))
            .map(file => ({
              name: file,
              path: `${oldBackupDir}/${file}`,
              location: 'Device Storage',
            }));
          allBackups.push(...backupFiles);
        }
      } catch (error) {
        console.warn('Failed to read old backup directory:', error);
      }
    }
    
    // Remove duplicates (same filename) and sort by date (newest first)
    const uniqueBackups = [];
    const seenNames = new Set();
    
    allBackups
      .sort((a, b) => b.name.localeCompare(a.name)) // Sort by filename (newest first)
      .forEach(backup => {
        if (!seenNames.has(backup.name)) {
          seenNames.add(backup.name);
          uniqueBackups.push(backup);
        }
      });
    
    return uniqueBackups;
  } catch (error) {
    console.warn('Failed to get backup files:', error);
    return [];
  }
};

/**
 * Pick backup file from device storage, Google Drive, or other locations
 */
export const pickBackupFile = async () => {
  try {
    const result = await DocumentPicker.pick({
      type: [DocumentPicker.types.allFiles],
      copyTo: 'cachesDirectory', // Copy to app's cache directory for access
    });

    if (result && result.length > 0) {
      const pickedFile = result[0];
      
      // Check if file is a database file
      if (!pickedFile.name?.endsWith('.db') && !pickedFile.name?.includes('backup')) {
        // Still allow it, user might have renamed the file
        console.warn('Selected file may not be a database backup file');
      }

      // Get the file path
      // DocumentPicker copies file to cache directory and provides fileCopyUri
      let filePath = null;
      
      if (pickedFile.fileCopyUri) {
        // On Android, fileCopyUri is the copied file path
        filePath = pickedFile.fileCopyUri.replace('file://', '');
      } else if (pickedFile.uri) {
        // On iOS or if fileCopyUri not available
        filePath = pickedFile.uri.replace('file://', '');
      }
      
      if (filePath && await RNFS.exists(filePath)) {
        return filePath;
      }
      
      throw new Error('Selected file could not be accessed');
    }
    
    return null;
  } catch (error) {
    if (DocumentPicker.isCancel(error) || error.code === 'DOCUMENT_PICKER_CANCELED') {
      return null; // User cancelled
    }
    throw new Error(`Failed to pick backup file: ${error.message || error.toString()}`);
  }
};

/**
 * Restore database from backup file
 */
export const restoreDatabaseFromBackup = async (backupPath) => {
  try {
    // Check if backup file exists
    const backupExists = await RNFS.exists(backupPath);
    if (!backupExists) {
      throw new Error('Backup file not found');
    }

    const dbPath = getDatabasePath();
    
    // Create a backup of current database before restoring (safety measure)
    const currentDbExists = await RNFS.exists(dbPath);
    if (currentDbExists) {
      const safetyBackupPath = `${dbPath}.safety-backup-${Date.now()}`;
      await RNFS.copyFile(dbPath, safetyBackupPath);
    }

    // Restore from backup
    await RNFS.copyFile(backupPath, dbPath);
    
    return true;
  } catch (error) {
    console.warn('Failed to restore database:', error);
    throw new Error(`Failed to restore database: ${error.message}`);
  }
};

export default createDatabaseBackup;


