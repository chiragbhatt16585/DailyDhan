import React from 'react';
import { Text, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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
const Tab = createBottomTabNavigator();

// Stack navigators for each tab
const DashboardStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
      <Stack.Screen name="Wallets" component={WalletsScreen} />
      <Stack.Screen name="Transactions" component={TransactionsScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="AffiliateAccounts" component={AffiliateAccountsScreen} />
    </Stack.Navigator>
  );
};

const ReportsStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Reports" component={ReportsListScreen} />
      <Stack.Screen name="IncomeExpenseReport" component={IncomeExpenseReportScreen} />
      <Stack.Screen name="CategoryExpenseReport" component={CategoryExpenseReportScreen} />
    </Stack.Navigator>
  );
};

const CategoriesStack = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Categories" component={CategoriesScreen} />
    </Stack.Navigator>
  );
};

const MainTabs = () => {
  const theme = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.dark ? '#888888' : '#666666',
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 65,
          paddingBottom: 8,
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
          if (route.name === 'CategoriesTab') {
            iconName = 'shape';
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
        name="CategoriesTab"
        component={CategoriesStack}
        options={{ title: 'Categories', tabBarLabel: 'Categories' }}
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


