// Comprehensive list of world currencies
export const CURRENCIES = [
  // Major currencies
  { code: 'USD', symbol: '$', name: 'US Dollar', country: 'United States' },
  { code: 'EUR', symbol: '€', name: 'Euro', country: 'European Union' },
  { code: 'GBP', symbol: '£', name: 'British Pound', country: 'United Kingdom' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', country: 'Japan' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', country: 'Australia' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', country: 'Canada' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', country: 'Switzerland' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', country: 'China' },
  
  // Asian currencies
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', country: 'India' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', country: 'Singapore' },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', country: 'Hong Kong' },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', country: 'South Korea' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', country: 'Malaysia' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', country: 'Thailand' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', country: 'Indonesia' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', country: 'Philippines' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', country: 'Vietnam' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee', country: 'Pakistan' },
  { code: 'BDT', symbol: '৳', name: 'Bangladeshi Taka', country: 'Bangladesh' },
  { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee', country: 'Sri Lanka' },
  { code: 'NPR', symbol: 'Rs', name: 'Nepalese Rupee', country: 'Nepal' },
  { code: 'MMK', symbol: 'K', name: 'Myanmar Kyat', country: 'Myanmar' },
  { code: 'KHR', symbol: '៛', name: 'Cambodian Riel', country: 'Cambodia' },
  { code: 'LAK', symbol: '₭', name: 'Lao Kip', country: 'Laos' },
  
  // Middle Eastern currencies
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham', country: 'United Arab Emirates' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal', country: 'Saudi Arabia' },
  { code: 'QAR', symbol: '﷼', name: 'Qatari Riyal', country: 'Qatar' },
  { code: 'KWD', symbol: 'د.ك', name: 'Kuwaiti Dinar', country: 'Kuwait' },
  { code: 'BHD', symbol: '.د.ب', name: 'Bahraini Dinar', country: 'Bahrain' },
  { code: 'OMR', symbol: '﷼', name: 'Omani Rial', country: 'Oman' },
  { code: 'JOD', symbol: 'د.ا', name: 'Jordanian Dinar', country: 'Jordan' },
  { code: 'ILS', symbol: '₪', name: 'Israeli Shekel', country: 'Israel' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', country: 'Turkey' },
  { code: 'IRR', symbol: '﷼', name: 'Iranian Rial', country: 'Iran' },
  { code: 'IQD', symbol: 'ع.د', name: 'Iraqi Dinar', country: 'Iraq' },
  { code: 'EGP', symbol: '£', name: 'Egyptian Pound', country: 'Egypt' },
  
  // European currencies
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble', country: 'Russia' },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', country: 'Norway' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', country: 'Sweden' },
  { code: 'DKK', symbol: 'kr', name: 'Danish Krone', country: 'Denmark' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', country: 'Poland' },
  { code: 'CZK', symbol: 'Kč', name: 'Czech Koruna', country: 'Czech Republic' },
  { code: 'HUF', symbol: 'Ft', name: 'Hungarian Forint', country: 'Hungary' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu', country: 'Romania' },
  { code: 'BGN', symbol: 'лв', name: 'Bulgarian Lev', country: 'Bulgaria' },
  { code: 'HRK', symbol: 'kn', name: 'Croatian Kuna', country: 'Croatia' },
  { code: 'RSD', symbol: 'дин', name: 'Serbian Dinar', country: 'Serbia' },
  { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia', country: 'Ukraine' },
  
  // African currencies
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', country: 'South Africa' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', country: 'Nigeria' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', country: 'Kenya' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', country: 'Ghana' },
  { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr', country: 'Ethiopia' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', country: 'Tanzania' },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', country: 'Uganda' },
  { code: 'MAD', symbol: 'د.م.', name: 'Moroccan Dirham', country: 'Morocco' },
  { code: 'TND', symbol: 'د.ت', name: 'Tunisian Dinar', country: 'Tunisia' },
  { code: 'DZD', symbol: 'د.ج', name: 'Algerian Dinar', country: 'Algeria' },
  
  // Americas currencies
  { code: 'MXN', symbol: '$', name: 'Mexican Peso', country: 'Mexico' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', country: 'Brazil' },
  { code: 'ARS', symbol: '$', name: 'Argentine Peso', country: 'Argentina' },
  { code: 'CLP', symbol: '$', name: 'Chilean Peso', country: 'Chile' },
  { code: 'COP', symbol: '$', name: 'Colombian Peso', country: 'Colombia' },
  { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', country: 'Peru' },
  { code: 'VES', symbol: 'Bs', name: 'Venezuelan Bolívar', country: 'Venezuela' },
  { code: 'UYU', symbol: '$U', name: 'Uruguayan Peso', country: 'Uruguay' },
  { code: 'PYG', symbol: 'Gs', name: 'Paraguayan Guaraní', country: 'Paraguay' },
  { code: 'BOB', symbol: 'Bs.', name: 'Bolivian Boliviano', country: 'Bolivia' },
  
  // Oceania currencies
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', country: 'New Zealand' },
  { code: 'FJD', symbol: 'FJ$', name: 'Fijian Dollar', country: 'Fiji' },
  { code: 'PGK', symbol: 'K', name: 'Papua New Guinean Kina', country: 'Papua New Guinea' },
];

// Default currency (Indian Rupee)
export const DEFAULT_CURRENCY = {
  code: 'INR',
  symbol: '₹',
  name: 'Indian Rupee',
  country: 'India',
};

// Helper function to get currency by code
export const getCurrencyByCode = (code) => {
  return CURRENCIES.find(c => c.code === code) || DEFAULT_CURRENCY;
};

// Helper function to format amount with currency
export const formatCurrency = (amount, currency = DEFAULT_CURRENCY) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return `${currency.symbol}0.00`;
  }
  return `${currency.symbol}${amount.toFixed(2)}`;
};

