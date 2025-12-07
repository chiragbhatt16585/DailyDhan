# How to Access Backup Files in Android Emulator

## Current Backup Location

Backups are saved to:
- **Android**: `/storage/emulated/0/Download/DailyDhanBackups/` (Downloads folder - easily accessible)
- **Fallback**: `/data/data/com.dailydhan/files/DailyDhanBackups/` (if Downloads not available)

## Method 1: Using ADB Commands (Recommended)

### List Backup Files:
```bash
# If backups are in Downloads folder (new location)
adb shell ls -la /storage/emulated/0/Download/DailyDhanBackups/

# If backups are in app's private directory (old location)
adb shell "run-as com.dailydhan ls -la /data/data/com.dailydhan/files/DailyDhanBackups/"
```

### Copy Backup File to Your Computer:
```bash
# From Downloads folder
adb pull /storage/emulated/0/Download/DailyDhanBackups/dailydhan-backup-YYYY-MM-DD.db ./

# From app's private directory
adb shell "run-as com.dailydhan cat /data/data/com.dailydhan/files/DailyDhanBackups/dailydhan-backup-YYYY-MM-DD.db" > backup.db
```

### Copy Backup File to Emulator:
```bash
# To Downloads folder
adb push backup.db /storage/emulated/0/Download/DailyDhanBackups/

# To app's private directory
adb push backup.db /data/local/tmp/
adb shell "run-as com.dailydhan cp /data/local/tmp/backup.db /data/data/com.dailydhan/files/DailyDhanBackups/"
```

## Method 2: Using Android Studio Device File Explorer

1. Open **Android Studio**
2. Go to **View** → **Tool Windows** → **Device File Explorer**
3. Navigate to:
   - **New location**: `/storage/emulated/0/Download/DailyDhanBackups/`
   - **Old location**: `/data/data/com.dailydhan/files/DailyDhanBackups/` (requires root or run-as)
4. Right-click files to download/upload

## Method 3: Using File Manager in Emulator

1. Open **Files** app in emulator
2. Navigate to **Downloads** folder
3. Look for **DailyDhanBackups** folder
4. You can view, share, or copy backup files from here

## Method 4: Using ADB Shell (Interactive)

```bash
# Enter shell
adb shell

# Navigate to Downloads folder
cd /storage/emulated/0/Download/DailyDhanBackups/

# List files
ls -la

# View file details
stat dailydhan-backup-*.db
```

## Quick Commands Reference

### Find All Backup Files:
```bash
adb shell find /storage/emulated/0 -name "*dailydhan-backup*" -type f
```

### Check Backup Directory:
```bash
adb shell ls -la /storage/emulated/0/Download/DailyDhanBackups/
```

### Get Backup File Info:
```bash
adb shell stat /storage/emulated/0/Download/DailyDhanBackups/dailydhan-backup-*.db
```

## New Backup Location (Downloads Folder)

**Why Downloads folder?**
- ✅ Easily accessible via file manager
- ✅ Visible in Android's Downloads app
- ✅ Can be accessed without root
- ✅ Works with file picker for restore
- ✅ Survives app uninstall (if not cleared)

**Path**: `/storage/emulated/0/Download/DailyDhanBackups/`

## Old Backup Location (App Private Directory)

**Path**: `/data/data/com.dailydhan/files/DailyDhanBackups/`

**Note**: This location is only accessible via ADB with `run-as` command or requires root access.

## Troubleshooting

### If backups not found in Downloads:
1. Check if app has storage permissions
2. Try old location: `/data/data/com.dailydhan/files/DailyDhanBackups/`
3. Use ADB commands to search: `adb shell find /storage -name "*dailydhan-backup*"`

### If ADB commands fail:
1. Make sure emulator is connected: `adb devices`
2. Make sure app is installed: `adb shell pm list packages | grep dailydhan`
3. Try with root: `adb root` (if emulator supports it)

## Testing Backup Location

After creating a backup, verify location:
```bash
# Check Downloads folder
adb shell ls -la /storage/emulated/0/Download/DailyDhanBackups/

# Check app's private directory
adb shell "run-as com.dailydhan ls -la /data/data/com.dailydhan/files/DailyDhanBackups/"
```

