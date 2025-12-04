# Ad Placement Guide

## 📍 Where the Ad Will Display

The ad banner is placed in the **Dashboard Screen** at the following location:

### Visual Layout:

```
┌─────────────────────────────────────┐
│         App Header                  │
├─────────────────────────────────────┤
│      Month Selector                 │
│    (← November 2024 →)             │
├─────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐     │
│  │Income│  │Expense│  │Balance│    │
│  └──────┘  └──────┘  └──────┘     │
├─────────────────────────────────────┤
│  ╔═══════════════════════════════╗ │
│  ║     AD BANNER APPEARS HERE     ║ │  ← 🎯 AD LOCATION
│  ║   (320x50 or 320x100 banner)  ║ │
│  ╚═══════════════════════════════╝ │
├─────────────────────────────────────┤
│   Expense Breakdown Chart          │
│   (Pie Chart)                      │
├─────────────────────────────────────┤
│   [Transactions] [Categories]      │
│   (Tab Menu)                       │
├─────────────────────────────────────┤
│   Transaction List /               │
│   Category List                    │
└─────────────────────────────────────┘
```

## 📱 Ad Position Details

- **Screen**: Dashboard Screen
- **Position**: After the financial summary cards (Income, Expense, Balance)
- **Before**: Expense Breakdown Chart
- **Component**: `AdBanner` from `src/components/AdBanner.js`
- **Style**: Centered, with margin top and bottom

## 🎨 Ad Styling

The ad container has the following styling:
- Centered alignment
- Margin vertical: 16px
- Transparent background
- Standard banner size (320x50 or 320x100)

## 📝 Code Location

**File**: `src/screens/Dashboard/DashboardScreen.js`
**Line**: ~212-216

```javascript
{/* Ad Banner - Displayed after financial summary cards */}
<View style={styles.adContainer}>
  <AdBanner />
</View>
```

## 🔄 Ad Behavior

- **Development**: Shows test ads (using `TestIds.BANNER`)
- **Production**: Shows real ads (using your Ad Unit ID)
- **Loading**: Ad loads automatically when Dashboard screen opens
- **Error Handling**: Logs errors to console if ad fails to load

## 📊 Ad Sizes Supported

The `AdBanner` component supports:
- `BannerAdSize.BANNER` (320x50) - Default
- `BannerAdSize.LARGE_BANNER` (320x100)
- `BannerAdSize.MEDIUM_RECTANGLE` (300x250)
- `BannerAdSize.FULL_BANNER` (468x60)

## ⚙️ To Change Ad Position

You can move the ad to different locations by moving this code block:

```javascript
<View style={styles.adContainer}>
  <AdBanner />
</View>
```

**Popular alternative positions:**
1. **Bottom of screen** - Before the FAB button
2. **Between tabs and content** - After tab menu, before transaction list
3. **Top of screen** - Right after App Header

## 🚀 Next Steps

1. Create Ad Unit IDs in AdMob dashboard
2. Update `src/components/AdBanner.js` with your Ad Unit ID
3. Test on real device (ads don't show in emulator properly)
4. Monitor ad performance in AdMob dashboard

