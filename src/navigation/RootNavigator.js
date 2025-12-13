import React from 'react';
import { Text, View, Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import SplashScreen from '../screens/Splash/SplashScreen';
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import AddTransactionScreen from '../screens/AddTransaction/AddTransactionScreen';
import CategoriesScreen from '../screens/Categories/CategoriesScreen';
import WalletsScreen from '../screens/Wallets/WalletsScreen';
import AddEditWalletScreen from '../screens/Wallets/AddEditWalletScreen';
import TransactionsScreen from '../screens/Transactions/TransactionsScreen';
import AnalyticsScreen from '../screens/Analytics/AnalyticsScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import CategoryExpenseReportScreen from '../screens/CategoryExpenseReport/CategoryExpenseReportScreen';
import AffiliateAccountsScreen from '../screens/AffiliateAccounts/AffiliateAccountsScreen';
import ReportsListScreen from '../screens/Reports/ReportsListScreen';
import IncomeExpenseReportScreen from '../screens/Report/ReportScreen';
import CategoryAnalysisReportScreen from '../screens/CategoryAnalysisReport/CategoryAnalysisReportScreen';
import YearlySummaryReportScreen from '../screens/YearlySummaryReport/YearlySummaryReportScreen';
import MonthlySummaryReportScreen from '../screens/MonthlySummaryReport/MonthlySummaryReportScreen';
import WalletWiseReportScreen from '../screens/WalletWiseReport/WalletWiseReportScreen';
import TopSpendingReportScreen from '../screens/TopSpendingReport/TopSpendingReportScreen';
import IncomeTrendsReportScreen from '../screens/IncomeTrendsReport/IncomeTrendsReportScreen';
import PremiumScreen from '../screens/Premium/PremiumScreen';
import BudgetsScreen from '../screens/Budgets/BudgetsScreen';
import RecurringTransactionsScreen from '../screens/RecurringTransactions/RecurringTransactionsScreen';
import AddEditRecurringTransactionScreen from '../screens/RecurringTransactions/AddEditRecurringTransactionScreen';
import MasterDataScreen from '../screens/MasterData/MasterDataScreen';
import SIPCalculatorScreen from '../screens/SIPCalculator/SIPCalculatorScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Stack navigators for each tab
const DashboardStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
      <Stack.Screen name="Wallets" component={WalletsScreen} />
      <Stack.Screen name="AddEditWallet" component={AddEditWalletScreen} />
      <Stack.Screen name="Transactions" component={TransactionsScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Categories" component={CategoriesScreen} />
      <Stack.Screen name="AffiliateAccounts" component={AffiliateAccountsScreen} />
      <Stack.Screen name="Premium" component={PremiumScreen} />
      <Stack.Screen name="RecurringTransactions" component={RecurringTransactionsScreen} />
      <Stack.Screen name="AddEditRecurringTransaction" component={AddEditRecurringTransactionScreen} />
      <Stack.Screen name="MasterData" component={MasterDataScreen} />
      <Stack.Screen name="SIPCalculator" component={SIPCalculatorScreen} />
    </Stack.Navigator>
  );
};

const ReportsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Reports" component={ReportsListScreen} />
      <Stack.Screen name="IncomeExpenseReport" component={IncomeExpenseReportScreen} />
      <Stack.Screen name="CategoryExpenseReport" component={CategoryExpenseReportScreen} />
      <Stack.Screen name="CategoryAnalysisReport" component={CategoryAnalysisReportScreen} />
      <Stack.Screen name="YearlySummaryReport" component={YearlySummaryReportScreen} />
      <Stack.Screen name="MonthlySummaryReport" component={MonthlySummaryReportScreen} />
      <Stack.Screen name="WalletWiseReport" component={WalletWiseReportScreen} />
      <Stack.Screen name="TopSpendingReport" component={TopSpendingReportScreen} />
      <Stack.Screen name="IncomeTrendsReport" component={IncomeTrendsReportScreen} />
      <Stack.Screen name="Premium" component={PremiumScreen} />
    </Stack.Navigator>
  );
};

const BudgetsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Budgets" component={BudgetsScreen} />
    </Stack.Navigator>
  );
};

const AffiliateStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AffiliateAccounts" component={AffiliateAccountsScreen} />
    </Stack.Navigator>
  );
};

const MainTabs = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.dark ? '#888888' : '#666666',
        tabBarStyle: {
          backgroundColor: theme.colors.surface || '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: theme.dark ? '#333333' : '#E0E0E0',
          elevation: Platform.OS === 'android' ? 8 : 0,
          shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0,
          shadowOffset: { width: 0, height: -2 },
          shadowRadius: 4,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 6,
        },
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: -4,
          marginBottom: 2,
        },
        tabBarIcon: ({ color, focused }) => {
          let iconName = 'home';
          if (route.name === 'DashboardTab') {
            iconName = 'view-dashboard';
          }
          if (route.name === 'ReportsTab') {
            iconName = 'file-chart';
          }
          if (route.name === 'BudgetsTab') {
            iconName = 'chart-line-variant';
          }
          if (route.name === 'AffiliateTab') {
            iconName = 'shopping';
          }
          return (
            <Icon 
              name={iconName} 
              size={24} 
              color={color}
              style={{ marginTop: 4 }}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardStack}
        options={{ title: 'Dashboard', tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name="ReportsTab"
        component={ReportsStack}
        options={{ title: 'Reports', tabBarLabel: 'Reports' }}
      />
      <Tab.Screen
        name="BudgetsTab"
        component={BudgetsStack}
        options={{ title: 'Budgets', tabBarLabel: 'Budgets' }}
      />
      <Tab.Screen
        name="AffiliateTab"
        component={AffiliateStack}
        options={{ title: 'Shop', tabBarLabel: 'Shop' }}
      />
    </Tab.Navigator>
  );
};

export const RootNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
    </Stack.Navigator>
  );
};


