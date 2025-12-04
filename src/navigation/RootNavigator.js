import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SplashScreen from '../screens/Splash/SplashScreen';
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import AddTransactionScreen from '../screens/AddTransaction/AddTransactionScreen';
import CategoriesScreen from '../screens/Categories/CategoriesScreen';
import WalletsScreen from '../screens/Wallets/WalletsScreen';
import TransactionsScreen from '../screens/Transactions/TransactionsScreen';
import AnalyticsScreen from '../screens/Analytics/AnalyticsScreen';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import CategoryExpenseReportScreen from '../screens/CategoryExpenseReport/CategoryExpenseReportScreen';
import AffiliateAccountsScreen from '../screens/AffiliateAccounts/AffiliateAccountsScreen';
import ReportsListScreen from '../screens/Reports/ReportsListScreen';
import IncomeExpenseReportScreen from '../screens/Report/ReportScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
      <Stack.Screen name="Categories" component={CategoriesScreen} />
      <Stack.Screen name="Wallets" component={WalletsScreen} />
      <Stack.Screen name="Transactions" component={TransactionsScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="CategoryExpenseReport" component={CategoryExpenseReportScreen} />
      <Stack.Screen name="AffiliateAccounts" component={AffiliateAccountsScreen} />
      <Stack.Screen name="Reports" component={ReportsListScreen} />
      <Stack.Screen name="IncomeExpenseReport" component={IncomeExpenseReportScreen} />
    </Stack.Navigator>
  );
};


