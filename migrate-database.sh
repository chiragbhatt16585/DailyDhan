#!/bin/bash

# Database Migration Script
# This script copies the database from old package to new package

echo "=== Database Migration Script ==="
echo ""

OLD_PACKAGE="com.dailydhanfull"
NEW_PACKAGE="com.google.hrivya.dailydhan"
DB_NAME="dailydhan.db"

# Check if device is connected
if ! adb devices | grep -q "device$"; then
    echo "❌ No Android device connected!"
    echo "Please connect your device via USB and enable USB debugging"
    exit 1
fi

echo "✅ Device connected"
echo ""

# Check if old package exists
echo "Checking for old package ($OLD_PACKAGE)..."
OLD_DB_EXISTS=$(adb shell "run-as $OLD_PACKAGE ls databases/$DB_NAME" 2>/dev/null)

if [ -z "$OLD_DB_EXISTS" ]; then
    echo "⚠️  Old package database not found"
    echo "The old app might have been uninstalled or database doesn't exist"
    echo ""
    echo "Trying alternative locations..."
    
    # Try to find database in other locations
    echo "Searching for database files..."
    adb shell "find /data/data -name '$DB_NAME' 2>/dev/null" | head -5
    exit 1
fi

echo "✅ Old database found!"
echo ""

# Pull old database to local machine
echo "Step 1: Pulling old database from device..."
adb shell "run-as $OLD_PACKAGE cat databases/$DB_NAME" > /tmp/old_dailydhan.db

if [ ! -f /tmp/old_dailydhan.db ] || [ ! -s /tmp/old_dailydhan.db ]; then
    echo "❌ Failed to pull old database"
    exit 1
fi

DB_SIZE=$(stat -f%z /tmp/old_dailydhan.db 2>/dev/null || stat -c%s /tmp/old_dailydhan.db 2>/dev/null)
echo "✅ Old database pulled (Size: $DB_SIZE bytes)"
echo ""

# Push to new package location
echo "Step 2: Pushing database to new package location..."
adb shell "run-as $NEW_PACKAGE mkdir -p databases"
adb shell "run-as $NEW_PACKAGE chmod 700 databases"
adb push /tmp/old_dailydhan.db /data/local/tmp/migrated_db.db
adb shell "run-as $NEW_PACKAGE cp /data/local/tmp/migrated_db.db databases/$DB_NAME"
adb shell "run-as $NEW_PACKAGE chmod 600 databases/$DB_NAME"
adb shell "rm /data/local/tmp/migrated_db.db"

# Verify
echo ""
echo "Step 3: Verifying migration..."
NEW_DB_EXISTS=$(adb shell "run-as $NEW_PACKAGE ls -lh databases/$DB_NAME" 2>/dev/null)

if [ -z "$NEW_DB_EXISTS" ]; then
    echo "❌ Migration failed - database not found in new location"
    exit 1
fi

echo "✅ Migration successful!"
echo ""
echo "Database details:"
echo "$NEW_DB_EXISTS"
echo ""
echo "🎉 Your data has been migrated!"
echo "Please restart your app to see your data."

# Cleanup
rm -f /tmp/old_dailydhan.db

