import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CURRENCY, getCurrencyByCode } from '../utils/currencies';
import { checkPremiumStatus, initIAP } from '../utils/premium';
import { ENABLE_PREMIUM_FEATURES } from '../config/premium';

const CURRENCY_STORAGE_KEY = '@DailyDhan:currency';
const PREMIUM_STATUS_KEY = '@DailyDhan:premium_status';

// Load currency from storage
const loadCurrency = async () => {
  try {
    const stored = await AsyncStorage.getItem(CURRENCY_STORAGE_KEY);
    if (stored) {
      const currencyData = JSON.parse(stored);
      return getCurrencyByCode(currencyData.code);
    }
  } catch (error) {
    console.warn('Failed to load currency from storage:', error);
  }
  return DEFAULT_CURRENCY;
};

// Initialize currency
let initialCurrency = DEFAULT_CURRENCY;
loadCurrency().then(currency => {
  initialCurrency = currency;
});

// Load premium status from storage
const loadPremiumStatus = async () => {
  try {
    const stored = await AsyncStorage.getItem(PREMIUM_STATUS_KEY);
    return stored === 'true';
  } catch (error) {
    console.warn('Failed to load premium status from storage:', error);
    return false;
  }
};

export const useAppStore = create((set, get) => ({
  selectedMonth: '',
  setSelectedMonth: month => set({ selectedMonth: month }),
  
  currency: initialCurrency,
  setCurrency: async (currency) => {
    try {
      await AsyncStorage.setItem(CURRENCY_STORAGE_KEY, JSON.stringify({
        code: currency.code,
        symbol: currency.symbol,
        name: currency.name,
        country: currency.country,
      }));
      set({ currency });
    } catch (error) {
      console.warn('Failed to save currency to storage:', error);
      set({ currency }); // Still update state even if storage fails
    }
  },
  
  // Initialize currency on app start
  initializeCurrency: async () => {
    const currency = await loadCurrency();
    set({ currency });
  },
  
  // Premium status
  isPremium: false,
  setPremium: (isPremium) => {
    set({ isPremium });
  },
  
  // Initialize premium status on app start
  initializePremium: async () => {
    // If premium features are disabled, always set premium to true
    if (!ENABLE_PREMIUM_FEATURES) {
      set({ isPremium: true });
      return;
    }
    
    try {
      // Initialize IAP connection
      await initIAP();
      // Check premium status
      const isPremium = await checkPremiumStatus();
      set({ isPremium });
    } catch (error) {
      console.warn('Failed to initialize premium status:', error);
      set({ isPremium: false });
    }
  },
  
  // Get effective premium status (respects feature flag)
  getEffectivePremium: () => {
    const state = get();
    return !ENABLE_PREMIUM_FEATURES || state.isPremium;
  },
}));


