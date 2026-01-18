# Quick Start: Supabase Integration

## ✅ What's Been Done

1. **Installed Supabase packages** (`@supabase/supabase-js`, polyfills)
2. **Created Supabase config file** (`src/config/supabase.js`) - **YOU NEED TO ADD YOUR KEYS HERE**
3. **Created migration script** (`src/database/migrateToSupabase.js`) - Exports all local data to Supabase
4. **Created Registration screen** (`src/screens/Auth/RegistrationScreen.js`) - Google OAuth login
5. **Updated navigation** - Registration screen is now the first screen
6. **Created setup guide** (`SUPABASE_SETUP_GUIDE.md`) - Complete step-by-step instructions

## 🚀 What You Need to Do Next

### Step 1: Set Up Supabase (15-20 minutes)

Follow the detailed guide: **`SUPABASE_SETUP_GUIDE.md`**

Quick checklist:
- [ ] Create Supabase project
- [ ] Copy SQL scripts and create all 5 tables
- [ ] Set up Google OAuth in Supabase
- [ ] Get your API keys (URL + anon key)
- [ ] Update `src/config/supabase.js` with your keys

### Step 2: Configure Deep Links (5 minutes)

**Android:**
- Edit `android/app/src/main/AndroidManifest.xml`
- Add deep link intent filter (see guide)

**iOS:**
- Edit `ios/DailyDhanFull/Info.plist`
- Add URL scheme (see guide)

### Step 3: Test It!

1. Rebuild your app: `npm run android` or `npm run ios`
2. You should see the Registration screen first
3. Tap "Continue with Google"
4. Sign in → Migration prompt appears (if you have local data)
5. Check Supabase Table Editor to see your migrated data

## 📁 Files Created/Modified

### New Files:
- `src/config/supabase.js` - Supabase client configuration
- `src/database/migrateToSupabase.js` - Complete migration script
- `src/screens/Auth/RegistrationScreen.js` - Registration/login screen
- `SUPABASE_SETUP_GUIDE.md` - Complete setup instructions
- `QUICK_START_SUPABASE.md` - This file

### Modified Files:
- `index.js` - Added polyfills for Supabase
- `src/navigation/RootNavigator.js` - Added Registration screen to navigation

## 🔑 Important: Update Your Supabase Keys

**Before testing, you MUST update:**

`src/config/supabase.js`:
```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';  // ← Replace this
const SUPABASE_ANON_KEY = 'YOUR_ANON_PUBLIC_KEY_HERE';       // ← Replace this
```

Get these from: Supabase Dashboard → Settings → API

## 📖 How Migration Works

1. User logs in with Google → Gets Supabase user ID
2. App checks for local SQLite data
3. If data exists → Shows migration prompt
4. User confirms → All data is uploaded to Supabase:
   - Categories
   - Wallets
   - Transactions
   - Budgets
   - Recurring Transactions
5. Data is now in Supabase, linked to user's account
6. Migration status saved → Won't prompt again

## 🎯 Next Steps (After Setup)

Once migration is working:

1. **Gradually switch your app code** from SQLite to Supabase
   - Start with one function (e.g., `getMonthlySummary`)
   - Create Supabase version
   - Test it
   - Replace SQLite calls with Supabase calls

2. **Add offline support** (optional)
   - Supabase has offline capabilities
   - Consider using Supabase Realtime for sync

3. **Remove SQLite dependency** (eventually)
   - Once all features use Supabase
   - Remove `react-native-sqlite-storage` from package.json

## 🆘 Need Help?

- Read `SUPABASE_SETUP_GUIDE.md` for detailed instructions
- Check Supabase docs: https://supabase.com/docs
- Common issues are covered in the troubleshooting section

---

**Ready to start? Open `SUPABASE_SETUP_GUIDE.md` and follow the steps! 🚀**

