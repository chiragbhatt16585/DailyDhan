# Data Recovery Guide

## Issue
Your data is not showing because when the package name changed from `com.dailydhanfull` to `com.google.hrivya.dailydhan`, the database is now in a different location on your device.

## Solution Options

### Option 1: Manual Database Copy (If Old App Still Exists)

If you still have the old app installed or its data:

1. **Connect your device via USB**
2. **Enable USB Debugging**
3. **Run the migration script:**
   ```bash
   ./migrate-database.sh
   ```

### Option 2: Restore from Backup

If you have a backup of your device:
- Restore the database file from backup
- Use the migration script to copy it to the new location

### Option 3: Check if Data Exists in Current Database

The database file exists (28KB), but it might be empty. Let's verify:

1. **Pull the database:**
   ```bash
   adb shell "run-as com.google.hrivya.dailydhan cat databases/dailydhan.db" > /tmp/check.db
   ```

2. **Check contents:**
   ```bash
   sqlite3 /tmp/check.db "SELECT COUNT(*) FROM transactions;"
   ```

### Option 4: Re-enter Data (If Lost)

If the data is truly lost and you don't have a backup:
- Unfortunately, you'll need to re-enter your transactions
- The app structure is intact, just the data needs to be re-added

## Quick Check

Run this to see if your current database has data:
```bash
adb shell "run-as com.google.hrivya.dailydhan cat databases/dailydhan.db" > /tmp/check.db && sqlite3 /tmp/check.db "SELECT COUNT(*) as transactions FROM transactions; SELECT COUNT(*) as categories FROM categories; SELECT COUNT(*) as wallets FROM wallets;"
```

## Prevention for Future

To prevent this in the future:
1. **Export your data regularly** - Add an export feature to your app
2. **Backup database** - Use Android's backup service
3. **Cloud sync** - Consider adding cloud backup

## Need Help?

If you have the old app still installed or a backup, we can recover your data. Otherwise, you may need to re-enter your transactions.

