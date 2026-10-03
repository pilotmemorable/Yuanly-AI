import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, View } from 'react-native';
import { ExploreScreen } from '../screens/ExploreScreen';
import { DetailScreen } from '../screens/DetailScreen';
import { AIConciergeScreen } from '../screens/AIConciergeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { PaymentScreen } from '../screens/PaymentScreen';
import { MyTripsScreen } from '../screens/MyTripsScreen';
import { QRTicketScreen } from '../screens/QRTicketScreen';
import { COLORS } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Search, MessageCircle, User, Calendar } from 'lucide-react-native';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  const { t } = useLanguage();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: COLORS.background, borderTopWidth: 0, elevation: 0, paddingBottom: 5, height: 60 },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Explore"
        component={ExploreScreen}
        options={{
          tabBarIcon: ({ color }) => <Search color={color} size={24} />,
          headerShown: false,
          tabBarLabel: t('tab.explore'),
        }}
      />
      <Tab.Screen
        name="MyTrips"
        component={MyTripsScreen}
        options={{
          tabBarIcon: ({ color }) => <Calendar color={color} size={24} />,
          headerShown: false,
          tabBarLabel: t('tab.trips'),
        }}
      />
      <Tab.Screen
        name="AI Concierge"
        component={AIConciergeScreen}
        options={{
          tabBarIcon: ({ color }) => <MessageCircle color={color} size={24} />,
          headerShown: false,
          tabBarLabel: t('tab.ai'),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color }) => <User color={color} size={24} />,
          headerShown: false,
          tabBarLabel: t('tab.profile'),
        }}
      />
    </Tab.Navigator>
  );
};

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
  </Stack.Navigator>
);

const AppStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Main" component={MainTabs} />
    <Stack.Screen name="Details" component={DetailScreen} />
    <Stack.Screen name="Payment" component={PaymentScreen} options={{ gestureEnabled: false }} />
    <Stack.Screen name="QRTicket" component={QRTicketScreen} />
  </Stack.Navigator>
);

export const AppNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
};