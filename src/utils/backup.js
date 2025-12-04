import { Platform } from 'react-native';
import RNFS from 'react-native-fs';

const DB_NAME = 'dailydhan.db';
const ANDROID_PACKAGE_NAME = 'com.google.hrivya.dailydhan';

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
    // Use app-specific external directory when available (no extra permission required)
    baseDir = RNFS.ExternalDirectoryPath || RNFS.DocumentDirectoryPath;
  } else {
    // iOS: app's Documents directory
    baseDir = RNFS.DocumentDirectoryPath;
  }

  const backupDir = `${baseDir}/DailyDhanBackups`;

  const exists = await RNFS.exists(backupDir);
  if (!exists) {
    await RNFS.mkdir(backupDir);
  }

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

export default createDatabaseBackup;


