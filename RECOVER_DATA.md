# Data Recovery Instructions

## Current Situation
- ✅ Database file exists in new location (28KB)
- ❌ Database is **EMPTY** (0 transactions, 0 categories, 0 wallets)
- ❌ Old app package (`com.dailydhanfull`) is not installed
- ❌ Old database location not accessible

## Why Data is Missing

When we changed the package name from `com.dailydhanfull` to `com.google.hrivya.dailydhan`, Android created a **new database** in the new package location. Your old data is still on the device in the old package's directory, but we can't access it because:

1. The old app is uninstalled
2. Android's sandboxing prevents accessing other apps' data

## Recovery Options

### Option 1: If You Have the Old App APK

1. **Reinstall the old app** (with package `com.dailydhanfull`)
2. **Export your data** from the old app (if export feature exists)
3. **Uninstall old app**
4. **Import data** into new app

### Option 2: Root Access (Advanced)

If your device is rooted:
```bash
adb shell "su -c 'cp /data/data/com.dailydhanfull/databases/dailydhan.db /data/data/com.google.hrivya.dailydhan/databases/dailydhan.db'"
```

### Option 3: Android Backup

If you have an Android backup:
1. Restore the backup
2. Reinstall old app to access data
3. Export data
4. Import into new app

### Option 4: Manual Recovery via ADB (If Old Data Directory Exists)

Try this command:
```bash
adb shell "su -c 'ls -la /data/data/com.dailydhanfull/databases/'"
```

If it shows the database file, copy it:
```bash
adb shell "su -c 'cp /data/data/com.dailydhanfull/databases/dailydhan.db /sdcard/old_db.db'"
adb pull /sdcard/old_db.db ./old_dailydhan.db
adb shell "run-as com.google.hrivya.dailydhan cp /sdcard/old_db.db databases/dailydhan.db"
```

## Immediate Solution

**If you can't recover the old data**, you'll need to:
1. Re-enter your transactions manually
2. Re-create your categories
3. Re-create your wallets

The app is working fine - it's just that the database is empty because it's a fresh install with the new package name.

## Prevention

To prevent this in the future, I can add:
1. **Data export feature** - Export to JSON/CSV
2. **Cloud backup** - Sync to cloud storage
3. **Backup reminder** - Remind users to backup regularly

Would you like me to add a data export feature to prevent this in the future?

