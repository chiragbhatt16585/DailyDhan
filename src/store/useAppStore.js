import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_CURRENCY, getCurrencyByCode } from '../utils/currencies';

const CURRENCY_STORAGE_KEY = '@DailyDhan:currency';

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
}));


