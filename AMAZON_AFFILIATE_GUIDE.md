# Amazon Affiliate Marketing Guide for DailyDhan

## ✅ Your Amazon Affiliate ID is Configured!

Your Amazon Associates affiliate ID **`dailydhan1658-21`** has been added to the app configuration.

## 📍 Where to Find It in the App

1. Open **DailyDhan** app
2. Go to **Settings** (gear icon)
3. Tap on **"Affiliate Programme"**
4. You'll see your **Amazon India** affiliate account listed

## 🔗 How Amazon Affiliate Links Work

### Basic Link Format
When users click "Open Link" in the app, it generates an Amazon.in link with your affiliate tag:
```
https://www.amazon.in/?tag=dailydhan1658-21
```

### Product-Specific Links
If you want to link to specific products, the format is:
```
https://www.amazon.in/dp/PRODUCT_ID?tag=dailydhan1658-21
```

## 💰 How to Earn Commissions

1. **Users click your affiliate link** from the DailyDhan app
2. **They browse and purchase** on Amazon within 24 hours
3. **You earn a commission** (typically 1-10% depending on product category)
4. **Commissions are tracked** by Amazon Associates dashboard

## 📊 Important Amazon Associates Rules

### ✅ What You CAN Do:
- Share affiliate links in your app
- Link to Amazon.in homepage
- Link to specific products
- Use text links, buttons, or banners
- Earn commissions on purchases made within 24 hours of clicking your link

### ❌ What You CANNOT Do:
- **Don't** use misleading text like "Click here for free shipping"
- **Don't** claim you're endorsed by Amazon
- **Don't** use Amazon logos without permission
- **Don't** incentivize clicks (e.g., "Click to win a prize")
- **Don't** use shortened URLs that hide the affiliate link

## 🎯 Best Practices

### 1. **Be Transparent**
   - The app already includes an information card explaining affiliate links
   - Users understand they're supporting the app at no extra cost

### 2. **Provide Value**
   - Link to products relevant to personal finance (budgeting books, financial tools, etc.)
   - Consider adding product recommendations in future updates

### 3. **Track Performance**
   - Log in to [Amazon Associates Dashboard](https://affiliate-program.amazon.in)
   - Monitor clicks, conversions, and earnings
   - Use this data to optimize your strategy

### 4. **Compliance**
   - Ensure your app complies with Amazon Associates Operating Agreement
   - Include proper disclosures about affiliate relationships

## 🔧 Technical Details

### Current Configuration
- **Platform**: Amazon India (amazon_in)
- **Affiliate ID**: `dailydhan1658-21`
- **Configuration File**: `src/config/affiliateAccounts.js`

### Adding More Amazon Accounts
If you have multiple Amazon accounts (US, UK, etc.), you can add them:

```javascript
{
  platformId: 'amazon',  // For Amazon.com (US)
  name: 'Amazon US',
  affiliateId: 'your-us-tag',
},
```

## 📱 How Users Will See It

1. **Settings → Affiliate Programme**
2. **Information Card** explaining why affiliate links are used
3. **Amazon India Card** with:
   - Platform icon and name
   - Your affiliate ID displayed
   - "Open Link" button to generate affiliate link
   - "Website" button to visit Amazon Associates page

## 🚀 Next Steps

1. **Test the Link**: 
   - Open the app → Settings → Affiliate Programme
   - Click "Open Link" on Amazon India
   - Verify it opens Amazon.in with your tag

2. **Monitor Dashboard**:
   - Check Amazon Associates dashboard regularly
   - Track clicks and conversions

3. **Consider Future Enhancements**:
   - Add product recommendations in relevant screens
   - Create curated lists (e.g., "Budgeting Essentials")
   - Add affiliate links to transaction notes or reports

## 📞 Support

- **Amazon Associates Support**: [affiliate-program.amazon.in/help](https://affiliate-program.amazon.in/help)
- **Amazon Associates Dashboard**: [affiliate-program.amazon.in](https://affiliate-program.amazon.in)

## ⚠️ Important Notes

- **Cookie Duration**: Amazon Associates uses 24-hour cookies
- **Commission Rates**: Vary by product category (1-10%)
- **Payment Threshold**: Minimum ₹1000 for India
- **Payment Method**: Bank transfer or Amazon Pay
- **Tax Information**: You'll need to provide PAN and other tax details

---

**Your affiliate account is ready to use!** 🎉

Users can now access your Amazon affiliate links through the Settings → Affiliate Programme section.

