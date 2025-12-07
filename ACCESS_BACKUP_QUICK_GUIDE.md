# Quick Guide: Access Backup Files in Android Emulator

## Current Backup Location

Your backups are saved to:
```
/storage/emulated/0/Android/data/com.dailydhan/files/DailyDhanBackups/
```

## Quick Access Commands

### 1. List All Backup Files:
```bash
adb shell ls -la /storage/emulated/0/Android/data/com.dailydhan/files/DailyDhanBackups/
```

### 2. Copy Backup to Your Computer:
```bash
adb pull /storage/emulated/0/Android/data/com.dailydhan/files/DailyDhanBackups/dailydhan-backup-*.db ./
```

### 3. Copy Backup from Computer to Emulator:
```bash
adb push backup.db /storage/emulated/0/Android/data/com.dailydhan/files/DailyDhanBackups/
```

### 4. View Backup File Details:
```bash
adb shell stat /storage/emulated/0/Android/data/com.dailydhan/files/DailyDhanBackups/dailydhan-backup-*.db
```

## Using Android Studio Device File Explorer

1. Open **Android Studio**
2. Click **View** → **Tool Windows** → **Device File Explorer**
3. Navigate to: `/storage/emulated/0/Android/data/com.dailydhan/files/DailyDhanBackups/`
4. Right-click any backup file → **Save As** to download

## Using File Manager in Emulator

1. Open **Files** app in emulator
2. Navigate to: **Internal Storage** → **Android** → **data** → **com.dailydhan** → **files** → **DailyDhanBackups**
3. You can view, share, or copy files from here

## New Backup Location (After Update)

After the update, new backups will be saved to:
```
/storage/emulated/0/Download/DailyDhanBackups/
```

This location is:
- ✅ Easier to access via file manager
- ✅ Visible in Downloads app
- ✅ More accessible for restore

## Note

The old location (`/storage/emulated/0/Android/data/com.dailydhan/files/DailyDhanBackups/`) will still work, but new backups will go to Downloads folder for easier access.

